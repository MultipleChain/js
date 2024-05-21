import { Provider } from '../services/Provider.ts'
import type { TransactionInterface } from '@multiplechain/types'
import { TransactionStatusEnum } from '@multiplechain/types'

export class Transaction implements TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {string} id Transaction id
     * @param {Provider} provider Blockchain network provider
     */
    constructor(id: string, provider?: Provider) {
        this.id = id
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {Promise<object | null>} Transaction data
     */
    async getData(): Promise<object | null> {
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
     * @returns {string} Transaction ID
     */
    getId(): string {
        return this.id
    }

    /**
     * @returns {string} Transaction URL
     */
    getUrl(): string {
        return 'example'
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSigner(): Promise<string> {
        return 'example'
    }

    /**
     * @returns {Promise<number>} Transaction fee
     */
    async getFee(): Promise<number> {
        return 0
    }

    /**
     * @returns {Promise<number>} Block number that transaction
     */
    async getBlockNumber(): Promise<number> {
        return 0
    }

    /**
     * @returns {Promise<number>} Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<number> {
        return 0
    }

    /**
     * @returns {Promise<number>} Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<number> {
        return 0
    }

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.CONFIRMED
    }
}
