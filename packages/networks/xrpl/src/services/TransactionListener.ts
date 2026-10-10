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
    webSocket?: WsClient

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * Active subscribe command (restored after reconnect)
     */
    private subscribeCommand?: Command

    /**
     * Active transaction stream handler
     */
    private transactionHandler?: (tx: TransactionStreamWithHash) => void | Promise<void>

    /**
     * Whether stop() was called intentionally
     */
    private intentionalStop = false

    /**
     * Incremented by every stop(); pending async work started before a stop must not start afterwards
     */
    private stopGeneration = 0

    /**
     * Reconnect backoff in milliseconds
     */
    private reconnectDelayMs = 1_000

    /**
     * Pending reconnect timer
     */
    private reconnectTimer?: ReturnType<typeof setTimeout>

    /**
     * Resilience handlers bound to the active client
     */
    private disconnectedHandler?: (code: number) => void
    private resilienceBound = false

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
        // Also covers a stop() while on() is still connecting (status is not true yet)
        this.stopGeneration++
        if (this.status) {
            this.status = false
            this.intentionalStop = true
            this.clearReconnectTimer()
            this.unbindResilience()
            this.dynamicStop()
        }
        this.provider.releaseWebSocket(this)
    }

    /**
     * Start the listener
     */
    start(): void {
        if (!this.status) {
            this.status = true
            this.intentionalStop = false
            this.restartSubscriptions()
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
        const generation = this.stopGeneration
        this.provider.holdWebSocket(this)

        try {
            await this.ensureWebSocket()
        } catch (error) {
            // stop() during the connect closed the socket; this is not a failure
            if (generation !== this.stopGeneration) {
                return false
            }
            if (!this.status) {
                this.provider.releaseWebSocket(this)
            }
            throw error
        }

        // stop() was called while connecting: do not start
        if (generation !== this.stopGeneration) {
            if (!this.status) {
                this.unbindResilience()
            }
            return false
        }

        this.callbacks.push(callback)
        this.start()

        return true
    }

    /**
     * Trigger the event when a transaction is detected
     * @param transaction - Transaction data
     */
    trigger<T extends TransactionTypeEnum>(transaction: TransactionListenerTriggerType<T>): void {
        // A stopped listener stays silent: an in-flight handler can reach here after stop()
        if (!this.status) {
            return
        }

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

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== undefined) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = undefined
        }
    }

    private unbindResilience(): void {
        if (this.webSocket === undefined || !this.resilienceBound) {
            return
        }

        if (this.disconnectedHandler !== undefined) {
            this.webSocket.removeListener('disconnected', this.disconnectedHandler)
            this.disconnectedHandler = undefined
        }

        this.resilienceBound = false
    }

    private bindResilience(): void {
        if (this.webSocket === undefined || this.resilienceBound) {
            return
        }

        this.disconnectedHandler = (): void => {
            if (this.intentionalStop || !this.status) {
                return
            }

            this.scheduleReconnect()
        }

        this.webSocket.on('disconnected', this.disconnectedHandler)
        this.resilienceBound = true
    }

    private scheduleReconnect(): void {
        if (this.intentionalStop || !this.status || this.reconnectTimer !== undefined) {
            return
        }

        try {
            this.dynamicStop()
        } catch {
            /* ignore unsubscribe errors on dead socket */
        }

        this.unbindResilience()
        this.webSocket = undefined
        this.provider.resetWebSocket()

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined
            void this.reconnect()
        }, this.reconnectDelayMs)

        this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30_000)
    }

    private async reconnect(): Promise<void> {
        if (this.intentionalStop || !this.status) {
            return
        }

        const generation = this.stopGeneration

        try {
            await this.ensureWebSocket()
            // stop() was called while reconnecting: do not resubscribe
            if (generation !== this.stopGeneration) {
                if (!this.status) {
                    this.unbindResilience()
                }
                return
            }
            await this.activateSubscription()
            this.reconnectDelayMs = 1_000
        } catch {
            this.scheduleReconnect()
        }
    }

    private async ensureWebSocket(): Promise<void> {
        if (this.webSocket === undefined || !this.webSocket.isConnected()) {
            this.webSocket = await this.provider.connectWebSocket()
            this.bindResilience()
        }
    }

    private restartSubscriptions(): void {
        try {
            this.dynamicStop()
        } catch {
            /* ignore */
        }

        // @ts-expect-error allow dynamic access
        this[TransactionListenerProcessIndex[this.type]]()
    }

    private async activateSubscription(): Promise<void> {
        if (this.subscribeCommand === undefined || this.transactionHandler === undefined) {
            return
        }

        if (this.webSocket === undefined) {
            return
        }

        const generation = this.stopGeneration
        const { sub, unSub } = this.createCommands(this.subscribeCommand)
        const handler = this.transactionHandler
        const unsubscribe = (): void => {
            if (this.webSocket?.isConnected()) {
                void this.webSocket.request(unSub).catch(() => {
                    /* ignore unsubscribe errors on closing socket */
                })
            }
        }

        try {
            await this.webSocket.request(sub)
        } catch (error) {
            throw error instanceof Error ? error : new Error(String(error))
        }

        // stop() was called while subscribing: drop the subscription instead of attaching
        if (generation !== this.stopGeneration) {
            unsubscribe()
            return
        }

        this.webSocket.on('transaction', handler)

        this.dynamicStop = () => {
            unsubscribe()
            this.webSocket?.off('transaction', handler)
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

        this.subscribeCommand = args
        this.transactionHandler = (tx: TransactionStreamWithHash): void => {
            if (
                this.filter?.signer !== undefined &&
                tx.tx_json?.Account.toLowerCase() !== this.filter.signer.toLowerCase()
            ) {
                return
            }

            this.trigger(new Transaction(tx.hash))
        }

        void this.activateSubscription().catch(() => {
            if (!this.intentionalStop && this.status) {
                this.scheduleReconnect()
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

        const args: Command = { streams: ['transactions'] }

        if (sender !== undefined || filter.receiver !== undefined) {
            const accounts: string[] = []
            if (sender !== undefined) {
                accounts.push(sender)
            }
            if (filter.receiver !== undefined) {
                accounts.push(filter.receiver)
            }
            args.accounts = accounts
        }

        this.subscribeCommand = args
        this.transactionHandler = async (tx: TransactionStreamWithHash): Promise<void> => {
            const txJson = tx.tx_json as { Account?: string; Destination?: string } | undefined

            interface ParamsType {
                sender?: string
                receiver?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (sender !== undefined) {
                expectedParams.sender = sender.toLowerCase()
                receivedParams.sender = txJson?.Account?.toLowerCase()
            }

            if (filter.receiver !== undefined) {
                expectedParams.receiver = filter.receiver.toLowerCase()
                receivedParams.receiver = txJson?.Destination?.toLowerCase()
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

        void this.activateSubscription().catch(() => {
            if (!this.intentionalStop && this.status) {
                this.scheduleReconnect()
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
