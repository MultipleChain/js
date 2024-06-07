import type {
    NftId,
    ContractAddress,
    TransactionId,
    TransferAmount,
    WalletAddress
} from '../defines'
import { TransactionTypeEnum } from '../enums'

/**
 * Filter types for each transaction type in TransactionListenerInterface
 */
export interface TransactionListenerFilterInterface {
    signer?: WalletAddress
}

export interface ContractTransactionListenerFilterInterface
    extends TransactionListenerFilterInterface {
    address?: ContractAddress
}

export interface AssetTransactionListenerFilterInterface
    extends TransactionListenerFilterInterface {
    sender?: WalletAddress
    receiver?: WalletAddress
}

export interface CoinTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface {
    amount?: TransferAmount
}

export interface TokenTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    amount?: TransferAmount
}

export interface NftTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    nftId?: NftId
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
 * Example: this[TransactionListenerProcessIndex[type]]()
 */
export const TransactionListenerProcessIndex = {
    [TransactionTypeEnum.GENERAL]: 'generalProcess',
    [TransactionTypeEnum.CONTRACT]: 'contractProcess',
    [TransactionTypeEnum.COIN]: 'coinProcess',
    [TransactionTypeEnum.TOKEN]: 'tokenProcess',
    [TransactionTypeEnum.NFT]: 'nftProcess'
}

/**
 * 'DynamicTransactionType' connects transaction types to their corresponding transaction interfaces
 * Every type of transaction has its own unique transaction interface.
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
     * Triggered transactions are stored in the 'triggeredTransactions' array.
     */
    triggeredTransactions: TransactionId[]

    /**
     * 'filter' is an object that has values depending on transaction listener type.
     * E.g. no matter which type of transaction is listening, 'filter' has to have a 'signer' value
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

    /**
     * If the listener is active, the 'stop' method deactivates the listener.
     * @returns {void}
     */
    stop: () => void

    /**
     * If the listener is inactive, the 'start' method activates the listener.
     * @returns {void}
     */
    start: () => void

    /**
     * The 'getStatus' method returns the status of the listener.
     * @returns {boolean}
     */
    getStatus: () => boolean

    /**
     * The 'on' method adds a callback function to the 'callbacks' array and starts the listener.
     * @param {CallBackType} callback - a function that is triggered when a transaction is detected.
     * @returns {Promise<boolean>}
     */
    on: (callback: CallBackType) => Promise<boolean>

    /**
     * The 'trigger' method is triggered when a transaction is detected.
     * @param {Transaction} transaction - a transaction that is detected.
     * @returns {void}
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
