import type { TransactionTypeEnum } from '../enums.js'
import type {
    TransactionListenerFilterInterface,
    ContractTransactionListenerFilterInterface,
    AssetTransactionListenerFilterInterface,
    CoinTransactionListenerFilterInterface,
    TokenTransactionListenerFilterInterface,
    NftTransactionListenerFilterInterface
} from '../index.js'
import type TransactionInterface from '../models/TransactionInterface.ts'

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

export interface TransactionListenerInterface<T extends TransactionTypeEnum> {
    /**
     * The 'type' property is a generic type that is used to define the type of transaction listener.
     */
    type: T

    /**
     * 'filter' is an object that has values depending on transaction listener type.
     * E.g. no matter which type of transaction is listening, 'filter' has to have a 'sender' value
     */
    filter?: DynamicTransactionListenerFilterType<T>

    /**
     * stop() method closes the corresponding listener of the instance it's called from.
     */
    stop: () => void

    /*
     * on() method is a listener that listens to the transaction events.
     * When a transaction is detected, it triggers the event.
     */
    on: (event: (transaction: TransactionInterface) => void) => void

    /**
     * listener methods for each transaction type
     */
    generalTransactionProcess: () => void

    contractTransactionProcess: () => void

    assetTransactionProcess: () => void

    coinTransactionProcess: () => void

    tokenTransactionProcess: () => void

    nftTransactionProcess: () => void
}
