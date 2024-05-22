import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'

import { Provider } from './Provider.ts'
import type { Ethers } from './Ethers.ts'
import { id, zeroPadValue } from 'ethers'
import { objectsEqual } from '@multiplechain/utils'
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { ErrorTypeEnum, TransactionListenerProcessIndex } from '@multiplechain/types'
import { ContractTransaction } from '../models/ContractTransaction.ts'
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
     * Transaction listener callback
     */
    callbacks: CallBackType[] = []

    /**
     * Transaction listener filter
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

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
    webSocket: WebSocketProvider

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * Triggered transactions
     */
    triggeredTransactions: string[] = []

    /**
     * @param {T} type - Transaction type
     * @param {DynamicTransactionListenerFilterType<T>} filter - Transaction listener filter
     * @param {Provider} provider - Provider
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
     * @returns {void}
     */
    stop(): void {
        if (this.status) {
            this.status = false
            this.dynamicStop()
        }
    }

    /**
     * Start the listener
     * @returns {void}
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
     * @returns {boolean} - Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param {CallBackType} callback - Callback function
     * @returns {Promise<boolean>}
     */
    async on(callback: CallBackType): Promise<boolean> {
        if (this.webSocket === undefined) {
            const socket = await this.provider.ethers.connectWebSocket()
            if (typeof socket === 'string') {
                throw new Error(ErrorTypeEnum.WS_CONNECTION_FAILED)
            } else {
                this.webSocket = socket
            }
        }

        this.start()
        this.callbacks.push(callback)

        return true
    }

    /**
     * Trigger the event when a transaction is detected
     * @param {TransactionListenerTriggerType<T>} transaction - Transaction data
     * @returns {void}
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
     * General transaction process
     * @returns {void}
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

        void this.webSocket.on('pending', callback)
        this.dynamicStop = () => {
            void this.webSocket.off('pending', callback)
        }
    }

    /**
     * Contract transaction process
     * @returns {void}
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

        void this.webSocket.on(params, callback)
        this.dynamicStop = () => {
            void this.webSocket.off(params, callback)
        }
    }

    /**
     * Coin transaction process
     * @returns {void}
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

        const callback = async (transactionId: string): Promise<void> => {
            const tx = await this.ethers.getTransaction(transactionId)

            if (tx === null) {
                return
            }

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

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            const contractBytecode = await this.ethers.getByteCode(tx?.to ?? '')

            if (contractBytecode !== '0x') {
                return
            }

            const transaction = new CoinTransaction(transactionId)

            if (filter.amount !== undefined) {
                await transaction.wait()
                const amount = await transaction.getAmount()
                if (amount !== filter.amount) {
                    return
                }
            }

            this.trigger(transaction)
        }

        void this.webSocket.on('pending', callback)
        this.dynamicStop = () => {
            void this.webSocket.off('pending', callback)
        }
    }

    /**
     * Token transaction process
     * @returns {void}
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

        void this.webSocket.on(params, callback)
        this.dynamicStop = () => {
            void this.webSocket.off(params, callback)
        }
    }

    /**
     * NFT transaction process
     * @returns {void}
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

        void this.webSocket.on(params, callback)
        this.dynamicStop = () => {
            void this.webSocket.off(params, callback)
        }
    }
}
