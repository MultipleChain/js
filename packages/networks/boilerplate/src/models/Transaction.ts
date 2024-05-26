import { Provider } from '../services/Provider'
import { TransactionStatusEnum } from '@multiplechain/types'
import {
    TransactionTypeEnum,
    type BlockConfirmationCount,
    type BlockNumber,
    type BlockTimestamp,
    type TransactionFee,
    type TransactionId,
    type TransactionInterface,
    type WalletAddress
} from '@multiplechain/types'

// custom tx data for each blockchain
type TxData = {}

export class Transaction implements TransactionInterface<TxData> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: TransactionId

    /**
     * Transaction data
     */
    data: TxData | null = null

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {TransactionId} id Transaction id
     * @param {Provider} provider Blockchain network provider
     */
    constructor(id: TransactionId, provider?: Provider) {
        this.id = id
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {Promise<TxData | null>} Transaction data
     */
    async getData(): Promise<TxData | null> {
        return {}
    }

    /**
     * @param {number} ms - Milliseconds to wait for the transaction to be confirmed. Default is 4000ms
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async wait(ms: number = 4000): Promise<TransactionStatusEnum> {
        return await Promise.resolve(TransactionStatusEnum.CONFIRMED)
    }

    /**
     * @returns {TransactionId} Transaction ID
     */
    getId(): TransactionId {
        return this.id
    }

    /**
     * @returns {Promise<TransactionTypeEnum>} Type of the transaction
     */
    getType(): Promise<TransactionTypeEnum> {
        return Promise.resolve(TransactionTypeEnum.GENERAL)
    }
    
    /**
     * @returns {string} Transaction URL
     */
    getUrl(): string {
        return 'example'
    }

    /**
     * @returns {Promise<WalletAddress>} Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @returns {Promise<TransactionFee>} Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        return 0
    }

    /**
     * @returns {Promise<BlockNumber>} Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        return 0
    }

    /**
     * @returns {Promise<BlockTimestamp>} Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        return 0
    }

    /**
     * @returns {Promise<BlockConfirmationCount>} Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        return 0
    }

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.CONFIRMED
    }
}
