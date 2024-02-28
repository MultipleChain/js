import type { TransactionTypeEnum } from '../enums.js'
import type {
    TransactionListenerFilterInterface,
    ContractTransactionListenerFilterInterface,
    AssetTransactionListenerFilterInterface,
    CoinTransactionListenerFilterInterface,
    TokenTransactionListenerFilterInterface,
    NftTransactionListenerFilterInterface
} from '../index.js'

/**
 * 'DynamicTransactionListenerFilterInterface' connects transaction types to their corresponding filter interfaces
 * Every type of transaction has its own unique filter values.
 * A sender's wallet address is a common value.
 */
interface DynamicTransactionListenerFilterInterface {
    [TransactionTypeEnum.GENERAL]: TransactionListenerFilterInterface
    [TransactionTypeEnum.CONTRACT]: ContractTransactionListenerFilterInterface
    [TransactionTypeEnum.ASSET]: AssetTransactionListenerFilterInterface
    [TransactionTypeEnum.COIN]: CoinTransactionListenerFilterInterface
    [TransactionTypeEnum.TOKEN]: TokenTransactionListenerFilterInterface
    [TransactionTypeEnum.NFT]: NftTransactionListenerFilterInterface
}

export default interface TransactionListenerInterface<T extends TransactionTypeEnum> {
    /**
     * 'listeners' is a static property that holds every listener class that is generated.
     * The purpose of this propery is to be used in stopAll() method to run stop() on each.
     * It can be reached from class without an instance since it's not related to instance it's created on.
     * @static
     */
    listeners: Array<TransactionListenerInterface<T>>

    /**
     * 'filter' is an object that has values depending on transaction listener type.
     * E.g. no matter which type of transaction is listening, 'filter' has to have a 'sender' value
     */
    filter: DynamicTransactionListenerFilterInterface[T]

    /**
     * @param type Type of the transaction that will be listened
     * @param filter Details of transaction that needs to be listened
     * @returns void
     */
    constructor: (type: T, filter: DynamicTransactionListenerFilterInterface[T]) => void

    /**
     * stop() method closes the corresponding listener of the instance it's called from.
     * @returns void
     */
    stop: () => void

    /**
     * stopAll() method iterates through every listener using array of transaction listeners
     * that defined as a static property 'listeners', and runs stop() method on each of them.
     * Since the stopAll() method calls stop() for each listener, 'listeners' property is needed
     * and it keeps track of each listener instance that is created.
     * @returns void
     * @static
     */
    stopAll: () => void

    GeneralTransactionProcess: () => void

    ContractTransactionProcess: () => void

    AssetTransactionProcess: () => void

    CoinTransactionProcess: () => void

    TokenTransactionProcess: () => void

    NftTransactionProcess: () => void
}
