import type { TransactionTypeEnum } from '../enums.js'
import type {
    TransactionListenerFilterInterface,
    ContractTransactionListenerFilterInterface,
    AssetTransactionListenerFilterInterface,
    CoinTransactionListenerFilterInterface,
    TokenTransactionListenerFilterInterface,
    NftTransactionListenerFilterInterface
} from '../index.js'

interface DynamicTransactionListenerFilterInterface {
    [TransactionTypeEnum.GENERAL]: TransactionListenerFilterInterface
    [TransactionTypeEnum.CONTRACT]: ContractTransactionListenerFilterInterface
    [TransactionTypeEnum.ASSET]: AssetTransactionListenerFilterInterface
    [TransactionTypeEnum.COIN]: CoinTransactionListenerFilterInterface
    [TransactionTypeEnum.TOKEN]: TokenTransactionListenerFilterInterface
    [TransactionTypeEnum.NFT]: NftTransactionListenerFilterInterface
}

export default interface TransactionListenerInterface<T extends TransactionTypeEnum> {
    listeners: Array<TransactionListenerInterface<T>> // static

    filter: DynamicTransactionListenerFilterInterface[T]

    constructor: (type: T, filter: DynamicTransactionListenerFilterInterface[T]) => void

    stop: () => void

    stopAll: () => void // static

    GeneralTransactionProcess: () => void

    ContractTransactionProcess: () => void

    AssetTransactionProcess: () => void

    CoinTransactionProcess: () => void

    TokenTransactionProcess: () => void

    NftTransactionProcess: () => void
}
