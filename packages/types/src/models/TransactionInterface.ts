import type { TransactionStatusEnum } from '../enums.js'

export default interface TransactionInterface {
    constructor: (id: string) => void

    getData: () => object

    getId: () => string
    getUrl: () => string
    getSender: () => string

    getFee: () => number
    getBlockNumber: () => number
    getBlockTimestamp: () => number
    getBlockConfirmationCount: () => number

    getStatus: () => TransactionStatusEnum
}
