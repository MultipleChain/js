import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    TransactionListenerCallbackType,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'

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
    filter: DynamicTransactionListenerFilterType<T>

    /**
     * @param type - Transaction type
     * @param filter - Transaction listener filter
     */
    constructor(type: T, filter: DynamicTransactionListenerFilterType<T>) {
        this.type = type
        this.filter = filter
        // @ts-expect-error allow dynamic access
        this[TransactionListenerProcessIndex[type]]()
    }

    /**
     * Close the listener
     */
    stop(): void {
        // Close the listener
    }

    /**
     * Listen to the transaction events
     * @param callback - Callback function
     */
    on(callback: TransactionListenerCallbackType): void {
        this.callbacks.push(callback)
    }

    /**
     * Trigger the event when a transaction is detected
     * @param transaction - Transaction data
     */
    trigger(transaction: DynamicTransactionType<T>): void {
        this.callbacks.forEach((callback) => {
            callback(transaction)
        })
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        // General transaction process
    }

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        // Contract transaction process
    }

    /**
     * Asset transaction process
     */
    assetProcess(): void {
        // Asset transaction process
    }

    /**
     * Coin transaction process
     */
    coinProcess(): void {
        // Coin transaction process
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
