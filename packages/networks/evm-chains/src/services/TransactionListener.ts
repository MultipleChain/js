import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    TransactionListenerCallbackType,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'

import { Provider } from './Provider.ts'
import type { Ethers } from './Ethers.ts'
import { Transaction } from '../models/Transaction.ts'
import type { WebSocketProvider, JsonRpcApiProvider } from 'ethers'
import { TransactionListenerProcessIndex } from '@multiplechain/types'
import { ContractTransaction } from '../models/ContractTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'

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
        this.callbacks.forEach((callback) => {
            callback(transaction)
        })
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        const callback = async (transactionId: string): Promise<void> => {
            if (this.filter?.signer === undefined) {
                this.trigger(new Transaction(transactionId))
            } else {
                const transaction = await this.ethers.getTransaction(transactionId)
                if (transaction?.from.toLowerCase() === this.filter.signer.toLowerCase()) {
                    this.trigger(new Transaction(transactionId))
                }
            }
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

            if (filter.address !== undefined && filter.signer !== undefined) {
                if (
                    transaction.from.toLowerCase() === filter.signer.toLowerCase() &&
                    transaction.to?.toLowerCase() === filter.address.toLowerCase()
                ) {
                    this.trigger(new ContractTransaction(transactionId))
                }
            } else if (filter.address !== undefined) {
                if (transaction.to?.toLowerCase() === filter.address.toLowerCase()) {
                    this.trigger(new ContractTransaction(transactionId))
                }
            } else if (filter.signer !== undefined) {
                if (transaction.from.toLowerCase() === filter.signer.toLowerCase()) {
                    this.trigger(new ContractTransaction(transactionId))
                }
            } else {
                this.trigger(new ContractTransaction(transactionId))
            }
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

            let transaction: CoinTransaction | undefined
            const sender = filter.sender ?? filter.signer

            if (sender !== undefined && filter.receiver !== undefined) {
                if (
                    tx.from.toLowerCase() === sender.toLowerCase() &&
                    tx.to?.toLowerCase() === filter.receiver.toLowerCase()
                ) {
                    transaction = new CoinTransaction(transactionId)
                }
            } else if (sender !== undefined) {
                if (tx.from.toLowerCase() === sender.toLowerCase()) {
                    transaction = new CoinTransaction(transactionId)
                }
            } else if (filter.receiver !== undefined) {
                if (tx.to?.toLowerCase() === filter.receiver.toLowerCase()) {
                    transaction = new CoinTransaction(transactionId)
                }
            } else {
                transaction = new CoinTransaction(transactionId)
            }

            if (filter.amount !== undefined && transaction !== undefined) {
                await transaction.wait()
                const amount = await transaction.getAmount()
                if (amount !== filter.amount) {
                    transaction = undefined
                }
            }

            if (transaction !== undefined) {
                this.trigger(transaction)
            }
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
        // Token transaction process
    }

    /**
     * NFT transaction process
     */
    nftProcess(): void {
        // NFT transaction process
    }
}
