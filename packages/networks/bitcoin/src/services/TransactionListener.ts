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
import { checkWebSocket } from '@multiplechain/utils'
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
> implements TransactionListenerInterface<T, DTransaction, CallBackType> {
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
     * Subscription payload resent after reconnect
     */
    private subscriptionMessage?: string

    /**
     * Parsed websocket message handler
     */
    private onData?: (data: any) => void

    /**
     * Keepalive interval handle
     */
    private keepaliveTimer?: ReturnType<typeof setInterval>

    /**
     * Active socket generation; stale close/error handlers are ignored
     */
    private connectionId = 0

    /**
     * Whether stop() was called intentionally
     */
    private intentionalStop = false

    /**
     * Whether the websocket endpoint was verified
     */
    private connectionVerified = false

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
            this.intentionalStop = true
            this.clearResilienceTimers()
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
        if (!this.connectionVerified) {
            try {
                await checkWebSocket(this.provider.wsUrl)
                this.connectionVerified = true
            } catch (error) {
                throw new Error(
                    'WebSocket connection is not available' +
                        (error instanceof Error ? ': ' + error.message : '')
                )
            }
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
        if (!this.triggeredTransactions.includes(transaction.id)) {
            this.triggeredTransactions.push(transaction.id)
            this.callbacks.forEach((callback) => {
                callback(transaction as unknown as DTransaction)
            })
        }
    }

    /**
     * Create message for the listener
     * @param receiver - Receiver address
     * @returns Message
     */
    createMessage(receiver?: string): string {
        let message
        if (this.provider.blockCypherToken !== undefined) {
            interface Config {
                event: string
                token: string
                address?: string
            }

            const config: Config = {
                event: 'unconfirmed-tx',
                token: this.provider.blockCypherToken
            }

            if (receiver !== undefined) {
                config.address = receiver
            }

            message = JSON.stringify(config)
        } else {
            message = JSON.stringify({
                'track-address': receiver
            })
        }

        this.dynamicStop = () => {
            this.intentionalStop = true
            this.clearResilienceTimers()
            this.webSocket?.close()
        }

        return message
    }

    private clearResilienceTimers(): void {
        if (this.keepaliveTimer !== undefined) {
            clearInterval(this.keepaliveTimer)
            this.keepaliveTimer = undefined
        }
    }

    private getPingMessage(): string | null {
        if (this.provider.blockCypherToken !== undefined) {
            return null
        }

        return JSON.stringify({ action: 'ping' })
    }

    private sendSubscription(): void {
        if (
            this.subscriptionMessage !== undefined &&
            this.webSocket?.readyState === WebSocket.OPEN
        ) {
            this.webSocket.send(this.subscriptionMessage)
        }
    }

    private startKeepalive(): void {
        const pingMessage = this.getPingMessage()

        if (pingMessage === null) {
            return
        }

        if (this.keepaliveTimer !== undefined) {
            clearInterval(this.keepaliveTimer)
        }

        this.keepaliveTimer = setInterval(() => {
            if (this.webSocket?.readyState === WebSocket.OPEN) {
                this.webSocket.send(pingMessage)
            }
        }, 30_000)
    }

    private scheduleReconnect(): void {
        if (this.intentionalStop || !this.status) {
            return
        }

        this.clearResilienceTimers()
        queueMicrotask(() => {
            if (!this.intentionalStop && this.status) {
                this.connectWebSocket()
            }
        })
    }

    private bindWebSocketHandlers(connectionId: number): void {
        this.webSocket.addEventListener('open', () => {
            if (connectionId !== this.connectionId) {
                return
            }

            this.sendSubscription()
            this.startKeepalive()
        })

        this.webSocket.addEventListener('message', (res: WebSocket.MessageEvent) => {
            if (connectionId !== this.connectionId) {
                return
            }

            let data: any

            try {
                data = JSON.parse(res.data as string)
            } catch {
                return
            }

            if (data.loadingIndicators) {
                return
            }

            this.onData?.(data)
        })

        this.webSocket.addEventListener('close', () => {
            if (connectionId !== this.connectionId) {
                return
            }

            this.clearResilienceTimers()
            this.scheduleReconnect()
        })

        this.webSocket.addEventListener('error', () => {
            if (connectionId !== this.connectionId) {
                return
            }

            if (this.webSocket.readyState === WebSocket.OPEN) {
                this.webSocket.close()
            }
        })

        if (this.webSocket.readyState === WebSocket.OPEN) {
            this.sendSubscription()
            this.startKeepalive()
        }
    }

    private connectWebSocket(): void {
        if (this.intentionalStop || !this.status) {
            return
        }

        const connectionId = ++this.connectionId
        this.webSocket = new WebSocket(this.provider.wsUrl)
        this.bindWebSocketHandlers(connectionId)
    }

    private ensureConnected(message: string, onData: (data: any) => void): void {
        this.subscriptionMessage = message
        this.onData = onData
        this.intentionalStop = false

        if (
            this.webSocket === undefined ||
            this.webSocket.readyState === WebSocket.CLOSED ||
            this.webSocket.readyState === WebSocket.CLOSING
        ) {
            this.connectWebSocket()
            return
        }

        if (this.webSocket.readyState === WebSocket.OPEN) {
            this.sendSubscription()
            this.startKeepalive()
        }
    }

    private extractTransactions(data: any): any[] | null {
        if (this.provider.blockCypherToken !== undefined) {
            if (data.hash === undefined) {
                return null
            }

            return [data]
        }

        const rawTransactions = data['address-transactions'] ?? data['block-transactions'] ?? null

        if (rawTransactions === null) {
            return null
        }

        const transactions =
            typeof rawTransactions === 'string' ? JSON.parse(rawTransactions) : rawTransactions

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return null
        }

        return transactions
    }

    private getValuesFromTx(
        tx: any,
        options?: { receiver?: string; sender?: string }
    ): Values | null {
        if (tx?.txid === undefined) {
            return null
        }

        const receiverFilter = options?.receiver?.toLowerCase()
        const senderFilter = options?.sender?.toLowerCase()

        let receiver: string | undefined
        let amount: number | undefined

        if (receiverFilter !== undefined) {
            const vout = tx.vout?.find(
                (output: any) => output.scriptpubkey_address?.toLowerCase() === receiverFilter
            )

            if (vout === undefined) {
                return null
            }

            receiver = vout.scriptpubkey_address
            amount = fromSatoshi(vout.value as number)
        } else {
            receiver = tx.vout?.[0]?.scriptpubkey_address
            amount = fromSatoshi(tx.vout?.[0]?.value as number)
        }

        let sender: string | undefined

        if (senderFilter !== undefined) {
            const vin = tx.vin?.find(
                (input: any) =>
                    !input.is_coinbase &&
                    input.prevout?.scriptpubkey_address?.toLowerCase() === senderFilter
            )

            if (vin === undefined) {
                return null
            }

            sender = vin.prevout.scriptpubkey_address
        } else {
            sender = tx.vin?.find((input: any) => !input.is_coinbase)?.prevout?.scriptpubkey_address
        }

        return {
            txId: tx.txid,
            sender,
            receiver,
            amount
        }
    }

    /**
     * Parse the data
     * @param data - Data
     * @param options - Optional address filters for matching inputs/outputs
     * @param options.receiver - Receiver address to match in outputs
     * @param options.sender - Sender address to match in inputs
     * @returns Parsed data, or null when the message has no transaction payload
     */
    getValues(data: any, options?: { receiver?: string; sender?: string }): Values | null {
        if (this.provider.blockCypherToken !== undefined) {
            if (data.hash === undefined) {
                return null
            }

            const receiverFilter = options?.receiver?.toLowerCase()
            const senderFilter = options?.sender?.toLowerCase()

            let receiver: string | undefined
            let amount: number | undefined

            if (receiverFilter !== undefined) {
                const output = data.outputs?.find(
                    (o: any) => o.addresses?.[0]?.toLowerCase() === receiverFilter
                )

                if (output === undefined) {
                    return null
                }

                receiver = output.addresses[0]
                amount = fromSatoshi(output.value as number)
            } else {
                receiver = data.outputs?.[0]?.addresses?.[0]
                amount = fromSatoshi(data.outputs?.[0]?.value as number)
            }

            let sender: string | undefined

            if (senderFilter !== undefined) {
                const input = data.inputs?.find(
                    (i: any) => i.addresses?.[0]?.toLowerCase() === senderFilter
                )

                if (input === undefined) {
                    return null
                }

                sender = input.addresses[0]
            } else {
                sender = data.inputs?.[0]?.addresses?.[0]
            }

            return {
                txId: data.hash,
                sender,
                receiver,
                amount
            }
        }

        const transactions = this.extractTransactions(data)

        if (transactions === null) {
            return null
        }

        return this.getValuesFromTx(transactions[0], options)
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        if (this.provider.blockCypherToken === undefined && this.filter?.signer === undefined) {
            throw new Error(
                'General transaction listener must have a signer filter when not using a BlockCypher token.'
            )
        }

        const message = this.createMessage(this.filter?.signer)

        this.ensureConnected(message, (data) => {
            const transactions = this.extractTransactions(data)

            if (transactions === null) {
                return
            }

            for (const tx of transactions) {
                const values = this.getValuesFromTx(tx, {
                    sender: this.filter?.signer
                })

                if (values === null) {
                    continue
                }

                this.trigger(new Transaction(values.txId))
            }
        })
    }

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
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

        if (
            this.provider.blockCypherToken === undefined &&
            sender === undefined &&
            filter.receiver === undefined
        ) {
            throw new Error(
                'Coin transaction listener must have a sender, signer, or receiver filter when not using a BlockCypher token.'
            )
        }

        const message = this.createMessage(filter.receiver ?? sender)

        this.ensureConnected(message, (data) => {
            if (data.event && String(data.event).includes('events limit reached')) {
                throw new Error('BlockCypher events limit reached.')
            }

            const transactions = this.extractTransactions(data)

            if (transactions === null) {
                return
            }

            for (const tx of transactions) {
                const values = this.getValuesFromTx(tx, {
                    receiver: filter.receiver,
                    sender
                })

                if (values === null) {
                    continue
                }

                if (filter.amount !== undefined && values.amount !== filter.amount) {
                    continue
                }

                this.trigger(new CoinTransaction(values.txId))
            }
        })
    }

    /**
     * Token transaction process
     */
    tokenProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }

    /**
     * NFT transaction process
     */
    nftProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }
}
