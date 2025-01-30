import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    TransactionId
} from '@multiplechain/types'
import WebSocket from 'isomorphic-ws'
import { Provider } from './Provider'
import { fromSatoshi } from '../utils'
import { Transaction } from '../models/Transaction'
import { CoinTransaction } from '../models/CoinTransaction'
import { checkWebSocket, objectsEqual } from '@multiplechain/utils'
import { TransactionListenerProcessIndex } from '@multiplechain/types'

interface Values {
    txId: string
    amount?: number
    sender?: string
    receiver?: string
}

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
    webSocket: WebSocket

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
                await checkWebSocket(this.provider.wsUrl)
                this.webSocket = new WebSocket(this.provider.wsUrl)
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

    isBlockCypherProcess(): boolean {
        return this.provider.isTestnet() || this.provider.blockCypherToken !== undefined
    }

    /**
     * Create message for the listener
     * @param receiver - Receiver address
     * @returns Message
     */
    createMessage(receiver?: string): string {
        let message
        if (this.isBlockCypherProcess()) {
            interface Config {
                event: string
                token: string
                address?: string
            }

            const config: Config = {
                event: 'unconfirmed-tx',
                token: this.provider.blockCypherToken ?? this.provider.defaultBlockCypherToken
            }

            if (receiver !== undefined) {
                config.address = receiver
            }

            message = JSON.stringify(config)
        } else {
            message = JSON.stringify({
                op: 'unconfirmed_sub'
            })
        }

        this.dynamicStop = () => {
            if (!this.isBlockCypherProcess()) {
                this.webSocket.send(
                    JSON.stringify({
                        op: 'unconfirmed_unsub'
                    })
                )
            }
            this.webSocket.close()
        }

        return message
    }

    /**
     * Parse the data
     * @param data - Data
     * @returns Parsed data
     */
    getValues(data: any): Values {
        const values: Values = {
            txId: ''
        }

        if (this.isBlockCypherProcess()) {
            values.txId = data.hash
            values.sender = data.inputs[0].addresses[0]
            values.receiver = data.outputs[0].addresses[0]
            values.amount = fromSatoshi(data.outputs[0].value as number)
        } else {
            values.txId = data.x.hash
            values.receiver = data.x.out[0].addr
            values.sender = data.x.inputs[0].prev_out.addr
            values.amount = fromSatoshi(data.x.out[0].value as number)
        }

        return values
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        const message = this.createMessage()

        this.webSocket.addEventListener('open', () => {
            this.webSocket.send(message)
        })

        this.webSocket.addEventListener('message', async (res: WebSocket.MessageEvent) => {
            const values = this.getValues(JSON.parse(res.data as string))

            if (
                this.filter?.signer !== undefined &&
                values.sender !== this.filter.signer.toLowerCase()
            ) {
                return
            }

            this.trigger(new Transaction(values.txId))
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

        const message = this.createMessage(filter.receiver)

        this.webSocket.addEventListener('open', () => {
            this.webSocket.send(message)
        })

        this.webSocket.addEventListener('message', async (res: WebSocket.MessageEvent) => {
            const data = JSON.parse(res.data as string)

            interface ParamsType {
                sender?: string
                receiver?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (String(data.event).includes('events limit reached')) {
                throw new Error('BlockCypher events limit reached.')
            }

            const values = this.getValues(data)

            if (sender !== undefined) {
                expectedParams.sender = sender.toLowerCase()
                receivedParams.sender = values.sender?.toLowerCase()
            }

            if (filter.receiver !== undefined) {
                expectedParams.receiver = filter.receiver.toLowerCase()
                receivedParams.receiver = values.receiver?.toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            const transaction = new CoinTransaction(values.txId)

            if (filter.amount !== undefined && values.amount !== filter.amount) {
                return
            }

            this.trigger(transaction)
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
