import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    TransactionId
} from '@multiplechain/types'

import { Provider } from './Provider.ts'
import type {
    Transaction,
    TokenTransaction,
    CoinTransaction,
    ContractTransaction,
    NftTransaction
} from '../models/index.ts'
import { TransactionListenerProcessIndex } from '@multiplechain/types'

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
    triggeredTransactions: TransactionId[] = []

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * @param {T} type - Transaction type
     * @param {DynamicTransactionListenerFilterType<T>} filter - Transaction listener filter
     * @param {Provider} provider - Provider
     */
    constructor(type: T, filter?: DynamicTransactionListenerFilterType<T>, provider?: Provider) {
        this.type = type
        this.filter = filter
        this.provider = provider ?? Provider.instance
        throw new Error('This class is not implemented for Tron')
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
     * @returns {boolean} Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param {CallBackType} callback - Transaction listener callback
     * @returns {Promise<boolean>}
     */
    async on(callback: CallBackType): Promise<boolean> {
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
