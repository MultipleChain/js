import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    TransactionListenerCallbackType,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'

import { Provider } from './Provider.ts'
import { TransactionListenerProcessIndex } from '@multiplechain/types'

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
        this.filter = filter
        this.provider = provider ?? Provider.instance
    }

    /**
     * Close the listener
     * @returns {void}
     */
    stop(): void {
        if (this.status) {
            this.status = false
            // stop the listener
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
     * @returns {boolean} Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param {TransactionListenerCallbackType} callback - Transaction listener callback
     * @returns {Promise<boolean>}
     */
    async on(callback: TransactionListenerCallbackType): Promise<boolean> {
        this.callbacks.push(callback)
        return true
    }

    /**
     * Trigger the event when a transaction is detected
     * @param {DynamicTransactionType<T>} transaction - Transaction data
     * @returns {void}
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
     * @returns {void}
     */
    generalProcess(): void {
        // General transaction process
    }

    /**
     * Contract transaction process
     * @returns {void}
     */
    contractProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }

    /**
     * Coin transaction process
     * @returns {void}
     */
    coinProcess(): void {
        // Coin transaction process
    }

    /**
     * Token transaction process
     * @returns {void}
     */
    tokenProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }

    /**
     * NFT transaction process
     * @returns {void}
     */
    nftProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }
}
