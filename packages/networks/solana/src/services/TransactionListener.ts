import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    TransactionListenerCallbackType,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'

import { Provider } from './Provider.ts'
import { Transaction } from '../models/Transaction.ts'
import { PublicKey, type LogsFilter } from '@solana/web3.js'
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
     * Connected status
     */
    connected: boolean = false

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
     * @param {TransactionListenerCallbackType} callback - Transaction listener callback
     * @returns {Promise<boolean>}
     */
    async on(callback: TransactionListenerCallbackType): Promise<boolean> {
        if (!this.connected) {
            if ((await this.provider.checkWsConnection()) instanceof Error) {
                throw new Error('WebSocket connection is not available')
            } else {
                this.connected = true
            }
        }

        this.start()
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
        let parameter: LogsFilter = 'all'

        if (this.filter?.signer !== undefined) {
            parameter = new PublicKey(this.filter.signer)
        }

        const subscriptionId = this.provider.web3.onLogs(
            parameter,
            (logs) => {
                this.trigger(new Transaction(logs.signature))
            },
            'recent'
        )

        this.dynamicStop = () => {
            void this.provider.web3.removeOnLogsListener(subscriptionId)
        }
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
