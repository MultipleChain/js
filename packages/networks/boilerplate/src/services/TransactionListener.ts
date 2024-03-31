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
     * @param {T} type - Transaction type
     * @param {Provider} provider - Provider
     * @param {DynamicTransactionListenerFilterType<T>} filter - Transaction listener filter
     */
    constructor(type: T, provider?: Provider, filter?: DynamicTransactionListenerFilterType<T>) {
        this.type = type
        this.filter = filter
        this.provider = provider ?? Provider.instance
        // @ts-expect-error allow dynamic access
        this[TransactionListenerProcessIndex[type]]()
    }

    /**
     * Close the listener
     * @returns {void}
     */
    stop(): void {
        // Close the listener
    }

    /**
     * Start the listener
     * @returns {void}
     */
    start(): void {
        // Start the listener
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
     * @returns {void}
     */
    on(callback: TransactionListenerCallbackType): void {
        this.callbacks.push(callback)
    }

    /**
     * Trigger the event when a transaction is detected
     * @param {DynamicTransactionType<T>} transaction - Transaction data
     * @returns {void}
     */
    trigger(transaction: DynamicTransactionType<T>): void {
        this.callbacks.forEach((callback) => {
            callback(transaction)
        })
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
        // Contract transaction process
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
        // Token transaction process
    }

    /**
     * NFT transaction process
     * @returns {void}
     */
    nftProcess(): void {
        // NFT transaction process
    }
}
