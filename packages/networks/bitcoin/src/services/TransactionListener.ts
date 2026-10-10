import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    TransactionId
} from '@multiplechain/types'
import axios from 'axios'
import WebSocket from 'isomorphic-ws'
import { Provider } from './Provider'
import { fromSatoshi, toSatoshi } from '../utils'
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
     * Incremented by every stop(). on() captures it on entry and refuses to
     * start if it changed while setup was awaiting, so a stop() issued during
     * a pending on() wins without permanently disabling the listener.
     */
    private stopGeneration = 0

    /**
     * Whether the websocket endpoint was verified
     */
    private connectionVerified = false

    /**
     * Timestamp (ms) of the last message received on the active socket.
     * Any inbound frame (including pong) refreshes it; the heartbeat uses
     * it to detect a silently dropped ("half-open") connection.
     */
    private lastMessageAt = 0

    /**
     * Consecutive reconnect attempts, used for exponential backoff
     */
    private reconnectAttempts = 0

    /**
     * Pending reconnect timer handle
     */
    private reconnectTimer?: ReturnType<typeof setTimeout>

    /**
     * Timer that resets the backoff once a connection proves stable
     */
    private stabilityTimer?: ReturnType<typeof setTimeout>

    /**
     * Whether at least one connection has already been established.
     * Used to run gap catch-up on reconnects but not on the first connect.
     */
    private hasConnectedOnce = false

    /**
     * Block height when the listener started. Catch-up replays confirmed
     * transactions only above this height, so a transaction that arrived AND
     * confirmed during a reconnect gap is still recovered, without ever
     * re-triggering historical activity from before the listener started.
     */
    private startBlockHeight?: number

    /**
     * Best-effort routine run after a reconnect to recover transactions
     * that arrived while the socket was down (mempool.space only pushes
     * transactions seen after subscription, so a reconnect gap can miss them).
     */
    private catchUp?: () => void | Promise<void>

    /**
     * Interval between keepalive pings (ms). Kept well below typical
     * proxy/Cloudflare idle timeouts so the connection stays alive.
     */
    private readonly pingIntervalMs = 15_000

    /**
     * Max silence (ms) tolerated before the socket is considered dead.
     * Three ping intervals, so a single slow pong does not trip it while
     * still keeping worst-case dead-connection detection around ~45-60s.
     */
    private readonly livenessTimeoutMs = 45_000

    /**
     * Timeout (ms) for REST calls made by the listener, matching the
     * websocket probe timeout so setup can never hang indefinitely.
     */
    private readonly requestTimeoutMs = 10_000

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
        this.stopGeneration++
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
        const stopGeneration = this.stopGeneration

        if (!this.connectionVerified) {
            try {
                await checkWebSocket(this.provider.wsUrl)
                this.connectionVerified = true
            } catch (error) {
                // Stopped while probing: the caller no longer wants this listener.
                if (stopGeneration !== this.stopGeneration) {
                    return false
                }
                throw new Error(
                    'WebSocket connection is not available' +
                        (error instanceof Error ? ': ' + error.message : '')
                )
            }
        }

        // Record the tip height once, so reconnect catch-up can recover a
        // transaction that both arrived and confirmed during a gap without
        // replaying older history. Best-effort; esplora endpoint only.
        if (
            stopGeneration === this.stopGeneration &&
            this.provider.blockCypherToken === undefined &&
            this.startBlockHeight === undefined
        ) {
            try {
                const res = await axios.get(this.provider.createEndpoint('blocks/tip/height'), {
                    timeout: this.requestTimeoutMs
                })
                const height = Number(res.data)
                if (Number.isFinite(height)) {
                    this.startBlockHeight = height
                }
            } catch {
                /* best-effort: confirmed catch-up is skipped if height is unknown */
            }
        }

        // A stop() issued while setup was pending wins: do not start.
        if (stopGeneration !== this.stopGeneration) {
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
        // A stopped listener stays silent: an in-flight catch-up request or a
        // frame still buffered on the closing socket can reach here after stop().
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

    /**
     * Clear per-connection timers (heartbeat + stability), leaving any
     * pending reconnect intact.
     */
    private clearHeartbeat(): void {
        if (this.keepaliveTimer !== undefined) {
            clearInterval(this.keepaliveTimer)
            this.keepaliveTimer = undefined
        }
        if (this.stabilityTimer !== undefined) {
            clearTimeout(this.stabilityTimer)
            this.stabilityTimer = undefined
        }
    }

    /**
     * Clear every resilience timer, including a scheduled reconnect.
     * Used when the listener is stopped for good.
     */
    private clearResilienceTimers(): void {
        this.clearHeartbeat()
        if (this.reconnectTimer !== undefined) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = undefined
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

    /**
     * Start the heartbeat: periodically ping the endpoint and, on ping-capable
     * endpoints, tear down the socket if it stops answering (dead-connection
     * detection). Also arms a stability timer that resets the backoff once the
     * connection has held for a while.
     */
    private startHeartbeat(): void {
        const pingMessage = this.getPingMessage()
        this.clearHeartbeat()
        this.lastMessageAt = Date.now()

        // Once a connection stays up for a while, treat it as healthy and
        // reset the backoff so the next unrelated drop reconnects quickly.
        this.stabilityTimer = setTimeout(() => {
            this.reconnectAttempts = 0
        }, 15_000)

        // BlockCypher has no app-level ping; rely on close + backoff only.
        if (pingMessage === null) {
            return
        }

        this.keepaliveTimer = setInterval(() => {
            if (this.webSocket?.readyState !== WebSocket.OPEN) {
                return
            }

            // No inbound frame (not even a pong) for too long => the socket is
            // silently dead. Force a reconnect instead of waiting forever.
            if (Date.now() - this.lastMessageAt > this.livenessTimeoutMs) {
                this.handleDeadConnection()
                return
            }

            this.webSocket.send(pingMessage)
        }, this.pingIntervalMs)
    }

    /**
     * Handle a socket that is open at the OS level but no longer delivering
     * data. Orphan the stale socket (so its late handlers are ignored), close
     * it, and schedule a backed-off reconnect.
     */
    private handleDeadConnection(): void {
        this.clearHeartbeat()
        const socket = this.webSocket
        this.connectionId++
        if (socket !== undefined) {
            try {
                socket.close()
            } catch {
                /* ignore */
            }
        }
        this.scheduleReconnect()
    }

    /**
     * Schedule a single reconnect with exponential backoff + jitter. Idempotent:
     * if a reconnect is already pending it is a no-op, so a dead-connection
     * teardown and a late close event cannot stack up into a hot reconnect loop
     * (which would get the IP rate-limited/banned).
     */
    private scheduleReconnect(): void {
        if (this.intentionalStop || !this.status) {
            return
        }

        if (this.reconnectTimer !== undefined) {
            return
        }

        this.clearHeartbeat()
        const delay = this.getReconnectDelay()
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined
            if (!this.intentionalStop && this.status) {
                this.connectWebSocket()
            }
        }, delay)
    }

    /**
     * Compute the next reconnect delay: exponential (1s, 2s, 4s, …) capped at
     * 30s, plus up to 30% jitter to avoid synchronized reconnect storms.
     * @returns Delay in milliseconds before the next reconnect attempt
     */
    private getReconnectDelay(): number {
        const base = 1_000
        const cap = 30_000
        const exp = Math.min(cap, base * 2 ** this.reconnectAttempts)
        this.reconnectAttempts++
        const jitter = Math.random() * exp * 0.3
        return Math.min(cap, Math.round(exp + jitter))
    }

    private bindWebSocketHandlers(connectionId: number): void {
        this.webSocket.addEventListener('open', () => {
            if (connectionId !== this.connectionId) {
                return
            }

            this.sendSubscription()
            this.startHeartbeat()

            // On a reconnect (not the first connect) recover anything missed
            // during the gap; the initial connect keeps its "future only" semantics.
            if (this.hasConnectedOnce) {
                void this.runCatchUp()
            }
            this.hasConnectedOnce = true
        })

        this.webSocket.addEventListener('message', (res: WebSocket.MessageEvent) => {
            if (connectionId !== this.connectionId) {
                return
            }

            // Any inbound frame (including {"pong":true}) proves the socket is alive.
            this.lastMessageAt = Date.now()

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

            this.clearHeartbeat()
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
            this.startHeartbeat()
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

    private ensureConnected(
        message: string,
        onData: (data: any) => void,
        catchUp?: () => void | Promise<void>
    ): void {
        this.subscriptionMessage = message
        this.onData = onData
        this.catchUp = catchUp
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
            this.startHeartbeat()
        }
    }

    /**
     * Run the registered catch-up routine, swallowing any failure. Catch-up is
     * best-effort; the live socket remains the primary source of truth.
     */
    private async runCatchUp(): Promise<void> {
        if (this.catchUp === undefined) {
            return
        }

        try {
            await this.catchUp()
        } catch {
            /* ignore: catch-up must never disrupt the live listener */
        }
    }

    /**
     * Fetch the transactions to replay after a reconnect for an address, via
     * the esplora/blockstream REST API. Includes every unconfirmed transaction
     * plus any transaction confirmed above the listener's start height, so a
     * transaction that arrived — or arrived and confirmed — during the gap is
     * recovered, while historical activity from before the listener started is
     * never replayed. Not available on the BlockCypher endpoint.
     * @param address - Address to fetch catch-up transactions for
     * @returns Array of transactions to replay, or empty when unavailable
     */
    private async fetchAddressCatchUpTxs(address: string): Promise<any[]> {
        if (this.provider.blockCypherToken !== undefined) {
            return []
        }

        // /txs returns pending transactions first, then the most recent confirmed.
        const url = this.provider.createEndpoint('address/' + address + '/txs')
        const response = await axios.get(url, { timeout: this.requestTimeoutMs })
        const txs = Array.isArray(response.data) ? response.data : []

        return txs.filter((tx: any) => {
            if (tx?.status?.confirmed !== true) {
                return true // still pending: a payment that landed during the gap
            }

            // Confirmed: replay only blocks mined after we started listening.
            return (
                this.startBlockHeight !== undefined &&
                typeof tx.status.block_height === 'number' &&
                tx.status.block_height > this.startBlockHeight
            )
        })
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
        // BlockCypher pushes a different shape (.hash/.outputs/.inputs/.addresses)
        // than esplora/mempool.space (.txid/.vout/.vin). Route accordingly.
        if (this.provider.blockCypherToken !== undefined) {
            return this.getValuesFromBlockCypherTx(tx, options)
        }

        if (tx?.txid === undefined) {
            return null
        }

        const receiverFilter = options?.receiver?.toLowerCase()
        const senderFilter = options?.sender?.toLowerCase()

        let receiver: string | undefined
        let amount: number | undefined

        if (receiverFilter !== undefined) {
            // An address can appear in multiple outputs, so total them all
            // instead of picking the first match.
            const outputs = (tx.vout ?? []).filter(
                (output: any) => output.scriptpubkey_address?.toLowerCase() === receiverFilter
            )

            if (outputs.length === 0) {
                return null
            }

            receiver = outputs[0].scriptpubkey_address
            amount = fromSatoshi(
                Number(
                    outputs.reduce(
                        (total: number, output: any) => total + (output.value as number),
                        0
                    )
                )
            )
        } else if (senderFilter !== undefined) {
            // Outgoing: the transferred amount is what left the sender, i.e.
            // every output not returning to the sender as change. Reading vout[0]
            // here would report the change output on many wallets.
            const all = tx.vout ?? []
            const outgoing = all.filter(
                (output: any) => output.scriptpubkey_address?.toLowerCase() !== senderFilter
            )
            const relevant = outgoing.length > 0 ? outgoing : all
            receiver = relevant[0]?.scriptpubkey_address
            amount = fromSatoshi(
                Number(
                    relevant.reduce(
                        (total: number, output: any) => total + (output.value as number),
                        0
                    )
                )
            )
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
    private getValuesFromBlockCypherTx(
        data: any,
        options?: { receiver?: string; sender?: string }
    ): Values | null {
        if (data?.hash === undefined) {
            return null
        }

        const receiverFilter = options?.receiver?.toLowerCase()
        const senderFilter = options?.sender?.toLowerCase()

        let receiver: string | undefined
        let amount: number | undefined

        if (receiverFilter !== undefined) {
            // An address can appear in multiple outputs, so total them all
            // instead of picking the first match.
            const outputs = (data.outputs ?? []).filter(
                (o: any) => o.addresses?.[0]?.toLowerCase() === receiverFilter
            )

            if (outputs.length === 0) {
                return null
            }

            receiver = outputs[0].addresses[0]
            amount = fromSatoshi(
                Number(outputs.reduce((total: number, o: any) => total + (o.value as number), 0))
            )
        } else if (senderFilter !== undefined) {
            // Outgoing: total what left the sender (every output not returning
            // to the sender as change), not vout[0] which is often the change.
            const all = data.outputs ?? []
            const outgoing = all.filter(
                (o: any) => o.addresses?.[0]?.toLowerCase() !== senderFilter
            )
            const relevant = outgoing.length > 0 ? outgoing : all
            receiver = relevant[0]?.addresses?.[0]
            amount = fromSatoshi(
                Number(relevant.reduce((total: number, o: any) => total + (o.value as number), 0))
            )
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

    /**
     * General transaction process
     */
    generalProcess(): void {
        if (this.provider.blockCypherToken === undefined && this.filter?.signer === undefined) {
            throw new Error(
                'General transaction listener must have a signer filter when not using a BlockCypher token.'
            )
        }

        const signer = this.filter?.signer
        const message = this.createMessage(signer)

        const handleTx = (tx: any): void => {
            const values = this.getValuesFromTx(tx, { sender: signer })

            if (values === null) {
                return
            }

            this.trigger(new Transaction(values.txId))
        }

        this.ensureConnected(
            message,
            (data) => {
                const transactions = this.extractTransactions(data)

                if (transactions === null) {
                    return
                }

                for (const tx of transactions) {
                    handleTx(tx)
                }
            },
            signer !== undefined
                ? async () => {
                      for (const tx of await this.fetchAddressCatchUpTxs(signer)) {
                          handleTx(tx)
                      }
                  }
                : undefined
        )
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

        // An amount filter is only well-defined against a receiver. Bitcoin has no
        // unambiguous "amount sent" for an outgoing transaction: change to a fresh
        // address is indistinguishable on-chain from a payment, so a sender-only
        // amount cannot be trusted. Require the receiver instead of silently
        // matching against an inflated best-effort amount.
        if (filter.amount !== undefined && filter.receiver === undefined) {
            throw new Error(
                'Coin transaction listener with an amount filter must also define a receiver; ' +
                    'the amount sent in an outgoing transaction cannot be determined unambiguously on Bitcoin.'
            )
        }

        const trackedAddress = filter.receiver ?? sender
        const message = this.createMessage(trackedAddress)

        const handleTx = (tx: any): void => {
            const values = this.getValuesFromTx(tx, {
                receiver: filter.receiver,
                sender
            })

            if (values === null) {
                return
            }

            // Compare as integer satoshis to avoid float-equality misses.
            if (filter.amount !== undefined) {
                if (
                    values.amount === undefined ||
                    Math.round(toSatoshi(values.amount)) !== Math.round(toSatoshi(filter.amount))
                ) {
                    return
                }
            }

            this.trigger(new CoinTransaction(values.txId))
        }

        this.ensureConnected(
            message,
            (data) => {
                if (data.event && String(data.event).includes('events limit reached')) {
                    throw new Error('BlockCypher events limit reached.')
                }

                const transactions = this.extractTransactions(data)

                if (transactions === null) {
                    return
                }

                for (const tx of transactions) {
                    handleTx(tx)
                }
            },
            trackedAddress !== undefined
                ? async () => {
                      for (const tx of await this.fetchAddressCatchUpTxs(trackedAddress)) {
                          handleTx(tx)
                      }
                  }
                : undefined
        )
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
