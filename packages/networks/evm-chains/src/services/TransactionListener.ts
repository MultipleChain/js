import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    TransactionId
} from '@multiplechain/types'

import { Provider } from './Provider'
import type { Ethers } from './Ethers'
import { id, zeroPadValue } from 'ethers'
import { objectsEqual } from '@multiplechain/utils'
import { Transaction } from '../models/Transaction'
import { NftTransaction } from '../models/NftTransaction'
import { CoinTransaction } from '../models/CoinTransaction'
import { TokenTransaction } from '../models/TokenTransaction'
import { TransactionListenerProcessIndex } from '@multiplechain/types'
import { ContractTransaction } from '../models/ContractTransaction'
import {
    type WebSocketProvider,
    type JsonRpcApiProvider,
    type EventFilter,
    type Log,
    type TransactionResponse
} from 'ethers'

type TransactionListenerTriggerType<T extends TransactionTypeEnum> = DynamicTransactionType<
    T,
    Transaction,
    ContractTransaction,
    CoinTransaction,
    TokenTransaction,
    NftTransaction
>

type TransactionListenerCallbackType<
    T extends TransactionTypeEnum,
    Transaction = TransactionListenerTriggerType<T>
> = (transaction: Transaction) => void

interface RawWebSocket {
    on: (event: string, handler: (...args: any[]) => void) => void
    removeListener: (event: string, handler: (...args: any[]) => void) => void
    readyState?: number
    close: () => void
}

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
     * JSON-RPC provider
     */
    ethers: Ethers

    /**
     * JSON-RPC provider
     */
    jsonRpc: JsonRpcApiProvider

    /**
     * WebSocket provider
     */
    webSocket?: WebSocketProvider

    /**
     * Transaction listener callback
     */
    callbacks: CallBackType[] = []

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * Triggered transactions
     */
    triggeredTransactions: TransactionId[] = []

    /**
     * Transaction listener filter
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

    /**
     * Whether stop() was called intentionally
     */
    private intentionalStop = false

    /**
     * Reconnect backoff in milliseconds
     */
    private reconnectDelayMs = 1_000

    /**
     * Pending reconnect timer
     */
    private reconnectTimer?: ReturnType<typeof setTimeout>

    /**
     * Bound websocket resilience handlers
     */
    private wsCloseHandler?: () => void
    private wsErrorHandler?: (error: Error) => void

    /**
     * @param type - Transaction type
     * @param filter - Transaction listener filter
     * @param provider - Provider
     */
    constructor(type: T, filter?: DynamicTransactionListenerFilterType<T>, provider?: Provider) {
        this.type = type
        this.filter = filter ?? {}
        this.provider = provider ?? Provider.instance
        this.ethers = this.provider.ethers
        this.jsonRpc = this.provider.ethers.jsonRpc
    }

    /**
     * Close the listener
     */
    stop(): void {
        if (this.status) {
            this.status = false
            this.intentionalStop = true
            this.clearReconnectTimer()
            this.unbindWebSocketResilience()
            this.dynamicStop()
        }
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
     * @returns - Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param callback - Callback function
     * @returns - listener status
     */
    async on(callback: CallBackType): Promise<boolean> {
        await this.ensureWebSocket()
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

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== undefined) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = undefined
        }
    }

    private getRawWebSocket(): RawWebSocket | undefined {
        if (this.webSocket === undefined) {
            return undefined
        }

        const provider = this.webSocket as WebSocketProvider & {
            _websocket?: RawWebSocket
            websocket?: RawWebSocket
        }

        return provider._websocket ?? provider.websocket
    }

    private unbindWebSocketResilience(): void {
        const raw = this.getRawWebSocket()

        if (raw === undefined) {
            return
        }

        if (this.wsCloseHandler !== undefined) {
            raw.removeListener('close', this.wsCloseHandler)
            this.wsCloseHandler = undefined
        }

        if (this.wsErrorHandler !== undefined) {
            raw.removeListener('error', this.wsErrorHandler)
            this.wsErrorHandler = undefined
        }
    }

    private bindWebSocketResilience(): void {
        const raw = this.getRawWebSocket()

        if (raw === undefined || this.wsCloseHandler !== undefined) {
            return
        }

        this.wsCloseHandler = (): void => {
            if (this.intentionalStop || !this.status) {
                return
            }

            this.scheduleReconnect()
        }

        this.wsErrorHandler = (): void => {
            if (this.intentionalStop || !this.status) {
                return
            }

            if (raw.readyState === 1) {
                raw.close()
            }
        }

        raw.on('close', this.wsCloseHandler)
        raw.on('error', this.wsErrorHandler)
    }

    private scheduleReconnect(): void {
        if (this.intentionalStop || !this.status || this.reconnectTimer !== undefined) {
            return
        }

        this.dynamicStop()
        this.unbindWebSocketResilience()

        try {
            void this.webSocket?.destroy()
        } catch {
            /* ignore */
        }

        this.webSocket = undefined
        this.ethers.resetWebSocket()

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

        try {
            await this.ensureWebSocket()
            this.restartSubscriptions()
            this.reconnectDelayMs = 1_000
        } catch {
            this.scheduleReconnect()
        }
    }

    private async ensureWebSocket(): Promise<void> {
        if (this.webSocket === undefined) {
            const socket = await this.provider.ethers.connectWebSocket()
            this.webSocket = socket
            this.bindWebSocketResilience()
        }
    }

    private restartSubscriptions(): void {
        this.dynamicStop()
        // @ts-expect-error allow dynamic access
        this[TransactionListenerProcessIndex[this.type]]()
    }

    private matchesCoinTransfer(
        tx: TransactionResponse,
        filter: DynamicTransactionListenerFilterType<TransactionTypeEnum.COIN>
    ): boolean {
        const sender = filter.sender ?? filter.signer

        interface ParamsType {
            sender?: string
            receiver?: string
        }

        const expectedParams: ParamsType = {}
        const receivedParams: ParamsType = {}

        if (sender !== undefined) {
            expectedParams.sender = sender.toLowerCase()
            receivedParams.sender = tx.from.toLowerCase()
        }

        if (filter.receiver !== undefined) {
            expectedParams.receiver = filter.receiver.toLowerCase()
            receivedParams.receiver = tx.to?.toLowerCase()
        }

        return objectsEqual(expectedParams, receivedParams)
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        const callback = async (transactionId: string): Promise<void> => {
            if (this.filter?.signer !== undefined) {
                const transaction = await this.ethers.getTransaction(transactionId)
                if (transaction?.from.toLowerCase() !== this.filter.signer.toLowerCase()) {
                    return
                }
            }

            this.trigger(new Transaction(transactionId))
        }

        void this.webSocket?.on('pending', callback)
        this.dynamicStop = () => {
            void this.webSocket?.off('pending', callback)
        }
    }

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        const filter = this
            .filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.CONTRACT>

        let params: string | EventFilter
        if (filter.address === undefined) {
            params = 'pending'
        } else {
            params = {
                address: filter.address
            }
        }

        const checkSigner = (transaction: TransactionResponse | null): boolean => {
            if (transaction === null) {
                return false
            }

            interface ParamsType {
                signer?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (filter.signer !== undefined) {
                expectedParams.signer = filter.signer.toLowerCase()
                receivedParams.signer = transaction.from.toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return false
            }

            return true
        }

        const callback = async (transactionIdOrLog: string | Log): Promise<void> => {
            let transaction: TransactionResponse | null
            if (typeof transactionIdOrLog === 'string') {
                transaction = await this.ethers.getTransaction(transactionIdOrLog)

                if (!checkSigner(transaction)) {
                    return
                }

                const contractBytecode = await this.ethers.getByteCode(transaction?.to ?? '')

                if (contractBytecode === '0x') {
                    return
                }
            } else {
                transaction = await this.ethers.getTransaction(transactionIdOrLog.transactionHash)
            }

            if (!checkSigner(transaction)) {
                return
            }

            // @ts-expect-error already checking ing checkSigner
            this.trigger(new ContractTransaction(transaction.hash))
        }

        void this.webSocket?.on(params, callback)
        this.dynamicStop = () => {
            void this.webSocket?.off(params, callback)
        }
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

        const callback = async (blockNumber: number): Promise<void> => {
            const block = await this.ethers.getBlock(blockNumber, true)

            if (block === null) {
                return
            }

            const transactions = block.prefetchedTransactions ?? []

            for (const tx of transactions) {
                if (tx.hash === undefined || !this.matchesCoinTransfer(tx, filter)) {
                    continue
                }

                const contractBytecode = await this.ethers.getByteCode(tx.to ?? '')

                if (contractBytecode !== '0x') {
                    continue
                }

                const transaction = new CoinTransaction(tx.hash)

                if (filter.amount !== undefined) {
                    await transaction.wait()
                    const amount = await transaction.getAmount()
                    if (amount !== filter.amount) {
                        continue
                    }
                }

                this.trigger(transaction)
            }
        }

        void this.webSocket?.on('block', callback)
        this.dynamicStop = () => {
            void this.webSocket?.off('block', callback)
        }
    }

    /**
     * Token transaction process
     */
    tokenProcess(): void {
        const filter = this
            .filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.TOKEN>

        const params: EventFilter = {
            address: filter.address,
            topics: [
                id('Transfer(address,address,uint256)'),
                filter.sender !== undefined ? zeroPadValue(filter.sender, 32) : null,
                filter.receiver !== undefined ? zeroPadValue(filter.receiver, 32) : null
            ]
        }

        const callback = async (transactionLog: Log): Promise<void> => {
            const transaction = new TokenTransaction(transactionLog.transactionHash)
            const data = await transaction.getData()

            if (data === null) {
                return
            }

            const decodedData = await transaction.decodeData(data.response)

            if (decodedData === null) {
                return
            }

            if (decodedData.name !== 'transfer' && decodedData.name !== 'transferFrom') {
                return
            }

            interface ParamsType {
                signer?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (filter.signer !== undefined) {
                expectedParams.signer = filter.signer.toLowerCase()
                receivedParams.signer = data.response.from.toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            if (filter.amount !== undefined) {
                await transaction.wait()
                const amount = await transaction.getAmount()
                if (amount !== filter.amount) {
                    return
                }
            }

            this.trigger(transaction)
        }

        void this.webSocket?.on(params, callback)
        this.dynamicStop = () => {
            void this.webSocket?.off(params, callback)
        }
    }

    /**
     * NFT transaction process
     */
    nftProcess(): void {
        const filter = this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.NFT>

        const params: EventFilter = {
            address: filter.address,
            topics: [
                id('Transfer(address,address,uint256)'),
                filter.sender !== undefined ? zeroPadValue(filter.sender, 32) : null,
                filter.receiver !== undefined ? zeroPadValue(filter.receiver, 32) : null,
                filter.nftId !== undefined
                    ? zeroPadValue(`0x0${filter.nftId.toString(16)}`, 32)
                    : null
            ]
        }

        const callback = async (transactionLog: Log): Promise<void> => {
            const transaction = new NftTransaction(transactionLog.transactionHash)
            const data = await transaction.getData()

            if (data === null) {
                return
            }

            const decodedData = await transaction.decodeData(data.response)

            if (decodedData === null) {
                return
            }

            if (decodedData.name !== 'transferFrom') {
                return
            }

            interface ParamsType {
                signer?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (filter.signer !== undefined) {
                expectedParams.signer = filter.signer.toLowerCase()
                receivedParams.signer = data.response.from.toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            this.trigger(transaction)
        }

        void this.webSocket?.on(params, callback)
        this.dynamicStop = () => {
            void this.webSocket?.off(params, callback)
        }
    }
}
