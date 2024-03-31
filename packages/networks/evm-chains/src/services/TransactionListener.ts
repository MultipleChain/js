import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    TransactionListenerCallbackType,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'

import { id } from 'ethers'
import { Provider } from './Provider.ts'
import type { Ethers } from './Ethers.ts'
import { objectsEqual } from '@multiplechain/utils'
import { Transaction } from '../models/Transaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TransactionListenerProcessIndex } from '@multiplechain/types'
import { ContractTransaction } from '../models/ContractTransaction.ts'
import type { WebSocketProvider, JsonRpcApiProvider, EventFilter, Log } from 'ethers'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'

export class TransactionListener<T extends TransactionTypeEnum>
    implements TransactionListenerInterface<T>
{
    /**
     * Transaction type
     */
    type: T

    /**
     * Transaction listener callback
     */
    callbacks: TransactionListenerCallbackType[] = []

    /**
     * Transaction listener filter
     */
    filter?: DynamicTransactionListenerFilterType<T>

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
     * @param type - Transaction type
     * @param filter - Transaction listener filter
     */
    constructor(type: T, filter?: DynamicTransactionListenerFilterType<T>, provider?: Provider) {
        this.type = type
        this.filter = filter
        this.provider = provider ?? Provider.instance
        this.ethers = this.provider.ethers
        this.jsonRpc = this.provider.ethers.jsonRpc
        // Check if the WebSocket URL is defined
        if (this.provider.ethers.webSocket === undefined) {
            throw new Error('WebSocket URL is not defined')
        } else {
            this.webSocket = this.provider.ethers.webSocket
        }
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
     * @returns - Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param callback - Callback function
     */
    on(callback: TransactionListenerCallbackType): void {
        this.start()
        this.callbacks.push(callback)
    }

    /**
     * Trigger the event when a transaction is detected
     * @param transaction - Transaction data
     */
    trigger<T extends TransactionTypeEnum>(transaction: DynamicTransactionType<T>): void {
        if (!this.triggeredTransactions.includes(transaction.id)) {
            this.triggeredTransactions.push(transaction.id)
            this.callbacks.forEach((callback) => {
                callback(transaction)
            })
        }
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

        void this.webSocket.on('pending', callback)
        this.dynamicStop = () => {
            void this.webSocket.off('pending', callback)
        }
    }

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        const filter = this
            .filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.CONTRACT>

        const callback = async (transactionId: string): Promise<void> => {
            const transaction = await this.ethers.getTransaction(transactionId)
            const contractBytecode = await this.ethers.getByteCode(transaction?.to ?? '')

            if (contractBytecode === '0x' || transaction === null) {
                return
            }

            interface ParamsType {
                address?: string
                signer?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (filter.address !== undefined) {
                expectedParams.address = filter.address.toLowerCase()
                receivedParams.address = transaction.to?.toLowerCase()
            }

            if (filter.signer !== undefined) {
                expectedParams.signer = filter.signer.toLowerCase()
                receivedParams.signer = transaction.from.toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            this.trigger(new ContractTransaction(transactionId))
        }

        void this.webSocket.on('pending', callback)
        this.dynamicStop = () => {
            void this.webSocket.off('pending', callback)
        }
    }

    /**
     * Coin transaction process
     */
    coinProcess(): void {
        const filter = this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.COIN>

        const callback = async (transactionId: string): Promise<void> => {
            if (
                filter.signer !== undefined &&
                filter.sender !== undefined &&
                filter.signer !== filter.sender
            ) {
                throw new Error(
                    'Sender and signer must be the same in coin transactions. Or only one of them can be defined.'
                )
            }

            const tx = await this.ethers.getTransaction(transactionId)
            const contractBytecode = await this.ethers.getByteCode(tx?.to ?? '')

            if (contractBytecode !== '0x' || tx === null) {
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
     */
    tokenProcess(): void {
        const filter = this
            .filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.TOKEN>

        const params: EventFilter = {
            topics: [id('Transfer(address,address,uint256)')]
        }

        if (filter.address !== undefined) {
            params.address = filter.address
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
                sender?: string
                receiver?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (filter.signer !== undefined) {
                expectedParams.signer = filter.signer.toLowerCase()
                receivedParams.signer = data.response.from.toLowerCase()
            }

            if (filter.sender !== undefined) {
                expectedParams.sender = filter.sender.toLowerCase()
                receivedParams.sender =
                    decodedData.name === 'transfer'
                        ? data.response.from.toLowerCase()
                        : decodedData.args[0].toLowerCase()
            }

            if (filter.receiver !== undefined) {
                expectedParams.receiver = filter.receiver.toLowerCase()
                receivedParams.receiver =
                    decodedData.name === 'transfer'
                        ? decodedData.args[0].toLowerCase()
                        : decodedData.args[1].toLowerCase()
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
     */
    nftProcess(): void {
        const filter = this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.NFT>

        const params: EventFilter = {
            topics: [id('Transfer(address,address,uint256)')]
        }

        if (filter.address !== undefined) {
            params.address = filter.address
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
                sender?: string
                receiver?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (filter.signer !== undefined) {
                expectedParams.signer = filter.signer.toLowerCase()
                receivedParams.signer = data.response.from.toLowerCase()
            }

            if (filter.sender !== undefined) {
                expectedParams.sender = filter.sender.toLowerCase()
                receivedParams.sender = decodedData.args[0].toLowerCase()
            }

            if (filter.receiver !== undefined) {
                expectedParams.receiver = filter.receiver.toLowerCase()
                receivedParams.receiver = decodedData.args[1].toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            if (filter.nftId !== undefined) {
                await transaction.wait()
                const nftId = await transaction.getNftId()
                if (nftId !== filter.nftId) {
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
}
