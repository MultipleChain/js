import type { TransactionStatusEnum } from '../enums.js'

export default interface TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     * @param id Transaction ID
     * @returns void
     */
    constructor: (id: string) => void

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    getData: () => object

    /**
     * @returns Unique ID of transaction that's defined when instance is created.
     */
    getId: () => string

    /**
     * @returns Blockchain explorer URL of the transaction. Dependant on network.
     */
    getUrl: () => string

    /**
     * @returns Wallet address of the sender of transaction
     */
    getSender: () => string

    /**
     * @returns Transaction fee as native coin amount
     */
    getFee: () => number

    /**
     * @returns Block ID of the transaction
     */
    getBlockNumber: () => number

    /**
     * @returns UNIX timestamp of the date that block is added to blockchain
     */
    getBlockTimestamp: () => number

    /**
     * @returns Block confirmation amount
     */
    getBlockConfirmationCount: () => number

    /**
     * @returns Status of the transaction.
     */
    getStatus: () => TransactionStatusEnum
}
