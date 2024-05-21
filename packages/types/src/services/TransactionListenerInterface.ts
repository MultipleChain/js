import { TransactionTypeEnum } from '../enums.ts'

/**
 * Filter types for each transaction type in TransactionListenerInterface
 */
export interface TransactionListenerFilterInterface {
    signer?: string
}

export interface ContractTransactionListenerFilterInterface
    extends TransactionListenerFilterInterface {
    address?: string
}

export interface AssetTransactionListenerFilterInterface
    extends TransactionListenerFilterInterface {
    sender?: string
    receiver?: string
}

export interface CoinTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface {
    amount?: number
}

export interface TokenTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    amount?: number
}

export interface NftTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    nftId?: number | string
}
/**
 * Filter types for each transaction type in TransactionListenerInterface
 */

/**
 * 'DynamicTransactionListenerFilterInterface' connects transaction types to their corresponding filter interfaces
 * Every type of transaction has its own unique filter values.
 * A sender's wallet address is a common value.
 */
export type DynamicTransactionListenerFilterType<T extends TransactionTypeEnum> =
    T extends TransactionTypeEnum.GENERAL
        ? TransactionListenerFilterInterface
        : T extends TransactionTypeEnum.CONTRACT
          ? ContractTransactionListenerFilterInterface
          : T extends TransactionTypeEnum.COIN
            ? CoinTransactionListenerFilterInterface
            : T extends TransactionTypeEnum.TOKEN
              ? TokenTransactionListenerFilterInterface
              : T extends TransactionTypeEnum.NFT
                ? NftTransactionListenerFilterInterface
                : never

/**
 * 'TransactionListenerProcessIndex' is an object that connects transaction types to their corresponding process methods.
 * Example: this[TransactionListenerProcessIndex[type] as keyof TransactionListener]()
 */
export const TransactionListenerProcessIndex = {
    [TransactionTypeEnum.GENERAL]: 'generalProcess',
    [TransactionTypeEnum.CONTRACT]: 'contractProcess',
    [TransactionTypeEnum.COIN]: 'coinProcess',
    [TransactionTypeEnum.TOKEN]: 'tokenProcess',
    [TransactionTypeEnum.NFT]: 'nftProcess'
}

/**
 * Dynamic types for transaction trigger and callback methods
 */
/**
 * 'DynamicTransactionType' connects transaction types to their corresponding transaction interfaces
 * Every type of transaction has its own unique transaction interface.
 * A sender's wallet address is a common value.
 */
export type DynamicTransactionType<
    T extends TransactionTypeEnum,
    Transaction,
    ContractTransaction,
    CoinTransaction,
    TokenTransaction,
    NftTransaction
> = T extends TransactionTypeEnum.GENERAL
    ? Transaction
    : T extends TransactionTypeEnum.CONTRACT
      ? ContractTransaction
      : T extends TransactionTypeEnum.COIN
        ? CoinTransaction
        : T extends TransactionTypeEnum.TOKEN
          ? TokenTransaction
          : T extends TransactionTypeEnum.NFT
            ? NftTransaction
            : never

export interface TransactionListenerInterface<
    T extends TransactionTypeEnum,
    Transaction,
    CallBackType
> {
    /**
     * The 'type' property is a generic type that is used to define the type of transaction listener.
     */
    type: T

    /**
     * 'status' is a boolean that shows the status of the listener.
     * If 'status' is true, the listener is active.
     * If 'status' is false, the listener is inactive.
     */
    status: boolean

    /**
     * 'callback' is an array of callback functions that are triggered when a transaction is detected.
     */
    callbacks: CallBackType[]

    /**
     * Triggered transactions
     */
    triggeredTransactions: string[]

    /**
     * 'filter' is an object that has values depending on transaction listener type.
     * E.g. no matter which type of transaction is listening, 'filter' has to have a 'sender' value
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

    /**
     * stop() method closes the corresponding listener of the instance it's called from.
     * @returns {void}
     */
    stop: () => void

    /**
     * start() method starts the corresponding listener of the instance it's called from.
     * @returns {void}
     */
    start: () => void

    /**
     * getStatus() method returns the status of the listener.
     * @returns {boolean}
     */
    getStatus: () => boolean

    /**
     * on() method is a listener that listens to the transaction events.
     * When a transaction is detected, it triggers the event.
     * @param {CallBackType} callback - a function that is triggered when a transaction is detected.
     * @return {Promise<boolean>}
     */
    on: (callback: CallBackType) => Promise<boolean>

    /**
     * trigger() method triggers the event when a transaction is detected.
     * @param {Transaction} transaction - a transaction that is detected.
     * @return {void}
     */
    trigger: (transaction: Transaction) => void

    /**
     * listener methods for each transaction type
     */
    generalProcess: () => void

    contractProcess: () => void

    coinProcess: () => void

    tokenProcess: () => void

    nftProcess: () => void
}
