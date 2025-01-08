import { Provider } from './Provider'
import { Transaction } from '../models/Transaction'
import { NftTransaction } from '../models/NftTransaction'
import { CoinTransaction } from '../models/CoinTransaction'
import { TokenTransaction } from '../models/TokenTransaction'
import { ContractTransaction } from '../models/ContractTransaction'
import { TransactionListenerProcessIndex, TransactionTypeEnum } from '@multiplechain/types'
import type {
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    NftTransactionListenerFilterInterface,
    TokenTransactionListenerFilterInterface,
    CoinTransactionListenerFilterInterface,
    ContractTransactionListenerFilterInterface,
    TransactionId
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
        if (this.status) {
            this.status = false
            // stop the listener
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
     * @returns listener status
     */
    async on(callback: CallBackType): Promise<boolean> {
        this.callbacks.push(callback)
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

    /**
     * General transaction process
     */
    generalProcess(): void {}

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        const filter = this.filter as ContractTransactionListenerFilterInterface
    }

    /**
     * Coin transaction process
     */
    coinProcess(): void {
        const filter = this.filter as CoinTransactionListenerFilterInterface
    }

    /**
     * Token transaction process
     */
    tokenProcess(): void {
        const filter = this.filter as TokenTransactionListenerFilterInterface
    }

    /**
     * NFT transaction process
     */
    nftProcess(): void {
        const filter = this.filter as NftTransactionListenerFilterInterface
    }
}
