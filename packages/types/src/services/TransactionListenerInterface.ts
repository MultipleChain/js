import type {
    TransactionInterface,
    ContractTransactionInterface,
    AssetTransactionInterface,
    CoinTransactionInterface,
    TokenTransactionInterface,
    NftTransactionInterface
} from '../models.ts'

import { TransactionTypeEnum } from '../enums.ts'
import type { AssetDirectionEnum } from '../enums.ts'

/**
 * Filter types for each transaction type in TransactionListenerInterface
 */
interface TransactionListenerFilterInterface {
    sender?: string
}

interface ContractTransactionListenerFilterInterface extends TransactionListenerFilterInterface {
    address?: string
}

interface AssetTransactionListenerFilterInterface extends TransactionListenerFilterInterface {
    receiver?: string
    direction?: AssetDirectionEnum
}

interface CoinTransactionListenerFilterInterface extends AssetTransactionListenerFilterInterface {
    amount?: string
}

interface TokenTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    amount?: number
}

interface NftTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    nftId?: string
}
/**
 * Filter types for each transaction type in TransactionListenerInterface
 */

/**
 * 'DynamicTransactionType' connects transaction types to their corresponding transaction interfaces
 * Every type of transaction has its own unique transaction interface.
 * A sender's wallet address is a common value.
 */
export type DynamicTransactionType<T extends TransactionTypeEnum> =
    T extends TransactionTypeEnum.GENERAL
        ? TransactionInterface
        : T extends TransactionTypeEnum.CONTRACT
          ? ContractTransactionInterface
          : T extends TransactionTypeEnum.ASSET
            ? AssetTransactionInterface
            : T extends TransactionTypeEnum.COIN
              ? CoinTransactionInterface
              : T extends TransactionTypeEnum.TOKEN
                ? TokenTransactionInterface
                : T extends TransactionTypeEnum.NFT
                  ? NftTransactionInterface
                  : never

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
          : T extends TransactionTypeEnum.ASSET
            ? AssetTransactionListenerFilterInterface
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
    [TransactionTypeEnum.ASSET]: 'assetProcess',
    [TransactionTypeEnum.COIN]: 'coinProcess',
    [TransactionTypeEnum.TOKEN]: 'tokenProcess',
    [TransactionTypeEnum.NFT]: 'nftProcess'
}

/**
 * 'TransactionListenerCallbackType' is a type of function that is triggered when a transaction is detected.
 * It takes a transaction as an argument.
 */
export type TransactionListenerCallbackType = (
    transaction: DynamicTransactionType<TransactionTypeEnum>
) => void

export interface TransactionListenerInterface<T extends TransactionTypeEnum> {
    /**
     * The 'type' property is a generic type that is used to define the type of transaction listener.
     */
    type: T

    /**
     * 'callback' is an array of callback functions that are triggered when a transaction is detected.
     */
    callbacks: TransactionListenerCallbackType[]

    /**
     * 'filter' is an object that has values depending on transaction listener type.
     * E.g. no matter which type of transaction is listening, 'filter' has to have a 'sender' value
     */
    filter?: DynamicTransactionListenerFilterType<T>

    /**
     * stop() method closes the corresponding listener of the instance it's called from.
     */
    stop: () => void

    /**
     * on() method is a listener that listens to the transaction events.
     * When a transaction is detected, it triggers the event.
     * @param callback - a function that is triggered when a transaction is detected.
     */
    on: (callback: TransactionListenerCallbackType) => void

    /**
     * trigger() method triggers the event when a transaction is detected.
     * @param transaction - the transaction that is detected
     */
    trigger: (transaction: DynamicTransactionType<T>) => void

    /**
     * listener methods for each transaction type
     */
    generalProcess: () => void

    contractProcess: () => void

    assetProcess: () => void

    coinProcess: () => void

    tokenProcess: () => void

    nftProcess: () => void
}
