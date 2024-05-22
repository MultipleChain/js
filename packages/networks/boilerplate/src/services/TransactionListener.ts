import { Provider } from './Provider.ts'
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { ContractTransaction } from '../models/ContractTransaction.ts'
import { TransactionListenerProcessIndex, TransactionTypeEnum } from '@multiplechain/types'
import type {
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    NftTransactionListenerFilterInterface,
    TokenTransactionListenerFilterInterface,
    CoinTransactionListenerFilterInterface,
    ContractTransactionListenerFilterInterface
} from '@multiplechain/types'

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
     * @param {CallBackType} callback - Transaction listener callback
     * @returns {Promise<boolean>}
     */
    async on(callback: CallBackType): Promise<boolean> {
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
    generalProcess(): void {}

    /**
     * Contract transaction process
     * @returns {void}
     */
    contractProcess(): void {
        const filter = this.filter as ContractTransactionListenerFilterInterface
    }

    /**
     * Coin transaction process
     * @returns {void}
     */
    coinProcess(): void {
        const filter = this.filter as CoinTransactionListenerFilterInterface
    }

    /**
     * Token transaction process
     * @returns {void}
     */
    tokenProcess(): void {
        const filter = this.filter as TokenTransactionListenerFilterInterface
    }

    /**
     * NFT transaction process
     * @returns {void}
     */
    nftProcess(): void {
        const filter = this.filter as NftTransactionListenerFilterInterface
    }
}
