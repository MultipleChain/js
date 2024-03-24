import type { TransactionInterface } from '@multiplechain/types'
import { TransactionStatusEnum } from '@multiplechain/types'
import { Provider } from '../services/Provider.ts'

export class Transaction implements TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * Provider instance
     */
    private readonly provider: Provider

    constructor(id: string) {
        this.id = id
        this.provider = Provider.instance
    }

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    async getData(): Promise<object | null> {
        try {
            const data = (await this.provider.ethers.getTransaction(this.id)) ?? {}
            const receipt = (await this.provider.ethers.getTransactionReceipt(this.id)) ?? {}
            const result: object = { ...data, ...receipt }
            return Object.keys(result).length !== 0 ? result : null
        } catch (error) {
            const e = error as Error
            if (String(e.message).includes('timeout')) {
                throw new Error('RPC Timeout')
            }
            throw new Error('Transaction not found')
        }
    }

    /**
     * @returns Transaction id from the blockchain network
     * this can be different names like txid, hash, signature etc.
     */
    getId(): string {
        return this.id
    }

    /**
     * @returns Blockchain explorer URL of the transaction. Dependant on network.
     */
    getUrl(): string {
        return 'example'
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Transaction fee as native coin amount
     */
    async getFee(): Promise<number> {
        return 0
    }

    /**
     * @returns Block ID of the transaction
     */
    async getBlockNumber(): Promise<number> {
        return 0
    }

    /**
     * @returns UNIX timestamp of the date that block is added to blockchain
     */
    async getBlockTimestamp(): Promise<number> {
        return 0
    }

    /**
     * @returns Confirmation count of the block that transaction is included
     */
    async getBlockConfirmationCount(): Promise<number> {
        return 0
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.CONFIRMED
    }
}
