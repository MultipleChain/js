import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    TransactionId
} from '@multiplechain/types'
import { Provider } from './Provider'
import { objectsEqual } from '@multiplechain/utils'
import { Transaction } from '../models/Transaction'
import { CoinTransaction } from '../models/CoinTransaction'
import { TransactionListenerProcessIndex } from '@multiplechain/types'
import {
    type SubscribeRequest,
    type TransactionStream,
    type UnsubscribeRequest,
    type Client as WsClient
} from 'xrpl'

type Command = Omit<SubscribeRequest, 'id' | 'command'>

type TransactionStreamWithHash = TransactionStream & { hash: string }

type TransactionListenerTriggerType<T extends TransactionTypeEnum> = DynamicTransactionType<
    T,
    Transaction,
    Transaction,
    CoinTransaction,
    Transaction,
    Transaction
>

type TransactionListenerCallbackType<
    T extends TransactionTypeEnum,
    Transaction = TransactionListenerTriggerType<T>
> = (transaction: Transaction) => void

export class TransactionListener<
    T extends TransactionTypeEnum,
    DTransaction extends TransactionListenerTriggerType<T>,
    CallBackType extends TransactionListenerCallbackType<T>
> implements TransactionListenerInterface<T, DTransaction, CallBackType>
{
    /**
     * Transaction type
     */
    type: T

    /**
     * Provider
     */
    provider: Provider

    /**
     * Listener status
     */
    status: boolean = false

    /**
     * Transaction listener callback
     */
    callbacks: CallBackType[] = []

    /**
     * Triggered transactions
     */
    triggeredTransactions: TransactionId[] = []

    /**
     * Transaction listener filter
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

    /**
     * WebSocket
     */
    webSocket: WsClient

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * @param type - Transaction type
     * @param filter - Transaction listener filter
     * @param provider - Provider
     */
    constructor(type: T, filter?: DynamicTransactionListenerFilterType<T>, provider?: Provider) {
        this.type = type
        this.filter = filter ?? {}
        this.provider = provider ?? Provider.instance
    }

    /**
     * Close the listener
     */
    stop(): void {
        if (this.status) {
            this.status = false
            this.dynamicStop()
        }
    }

    /**
     * Start the listener
     */
    start(): void {
        if (!this.status) {
            this.status = true
            // @ts-expect-error allow dynamic access
            this[TransactionListenerProcessIndex[this.type]]()
        }
    }

    /**
     * Get the listener status
     * @returns Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param callback - Transaction listener callback
     * @returns Connection status
     */
    async on(callback: CallBackType): Promise<boolean> {
        if (this.webSocket === undefined) {
            try {
                await this.provider.ws.connect()
                this.webSocket = this.provider.ws
            } catch (error) {
                throw new Error(
                    'WebSocket connection is not available' +
                        (error instanceof Error ? ': ' + error.message : '')
                )
            }
        }

        this.start()
        this.callbacks.push(callback)

        return true
    }

    /**
     * Trigger the event when a transaction is detected
     * @param transaction - Transaction data
     */
    trigger<T extends TransactionTypeEnum>(transaction: TransactionListenerTriggerType<T>): void {
        if (!this.triggeredTransactions.includes(transaction.id)) {
            this.triggeredTransactions.push(transaction.id)
            this.callbacks.forEach((callback) => {
                callback(transaction as unknown as DTransaction)
            })
        }
    }

    idByFilter(): string {
        return btoa(JSON.stringify(this.filter) + this.type)
    }

    createCommands(args: Command): {
        sub: SubscribeRequest
        unSub: UnsubscribeRequest
    } {
        return {
            sub: {
                id: this.idByFilter(),
                command: 'subscribe',
                ...args
            },
            unSub: {
                id: this.idByFilter(),
                command: 'unsubscribe',
                ...args
            }
        }
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        const args: Command = { streams: ['transactions'] }

        if (this.filter?.signer) {
            args.accounts = [this.filter.signer]
        }

        const { sub, unSub } = this.createCommands(args)

        void this.webSocket.request(sub).then(() => {
            const callback = (tx: TransactionStreamWithHash): void => {
                if (
                    this.filter?.signer !== undefined &&
                    tx.tx_json?.Account.toLowerCase() !== this.filter.signer.toLowerCase()
                ) {
                    return
                }

                this.trigger(new Transaction(tx.hash))
            }

            this.webSocket.on('transaction', callback)

            this.dynamicStop = () => {
                void this.webSocket.request(unSub)
                void this.webSocket.off('transaction', callback)
            }
        })
    }

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        throw new Error('This method is not implemented for CRPl.')
    }

    /**
     * Coin transaction process
     */
    coinProcess(): void {
        const filter = this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.COIN>

        if (
            filter.signer !== undefined &&
            filter.sender !== undefined &&
            filter.signer !== filter.sender
        ) {
            throw new Error(
                'Sender and signer must be the same in coin transactions. Or only one of them can be defined.'
            )
        }

        const sender = filter.sender ?? filter.signer

        const args: Command & {
            accounts: string[]
        } = { streams: ['transactions'], accounts: [] }

        if (sender) {
            args.accounts.push(sender)
        }

        if (filter.receiver) {
            args.accounts.push(filter.receiver)
        }

        const { sub, unSub } = this.createCommands(args)

        void this.webSocket.request(sub).then(() => {
            const callback = async (
                tx: TransactionStreamWithHash & {
                    tx_json: {
                        Account: string
                        Destination?: string
                    }
                }
            ): Promise<void> => {
                interface ParamsType {
                    sender?: string
                    receiver?: string
                }

                const expectedParams: ParamsType = {}
                const receivedParams: ParamsType = {}

                if (sender !== undefined) {
                    expectedParams.sender = sender.toLowerCase()
                    receivedParams.sender = tx.tx_json?.Account.toLowerCase()
                }

                if (filter.receiver !== undefined) {
                    expectedParams.receiver = filter.receiver.toLowerCase()
                    receivedParams.receiver = tx.tx_json?.Destination?.toLowerCase()
                }

                if (!objectsEqual(expectedParams, receivedParams)) {
                    return
                }

                const transaction = new CoinTransaction(tx.hash)

                if (filter.amount !== undefined) {
                    await transaction.wait()
                    const amount = await transaction.getAmount()
                    if (amount !== filter.amount) {
                        return
                    }
                }

                this.trigger(transaction)
            }

            this.webSocket.on('transaction', callback)

            this.dynamicStop = () => {
                void this.webSocket.request(unSub)
                void this.webSocket.off('transaction', callback)
            }
        })
    }

    /**
     * Token transaction process
     */
    tokenProcess(): void {
        throw new Error('This method is not implemented for CRPl.')
    }

    /**
     * NFT transaction process
     */
    nftProcess(): void {
        throw new Error('This method is not implemented for CRPl.')
    }
}
