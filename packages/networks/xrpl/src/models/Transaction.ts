import axios from 'axios'
import { Provider } from '../services/Provider'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
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

export class Transaction implements TransactionInterface<any> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: TransactionId

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * Transaction data
     */
    data: any | null = null

    /**
     * @param id Transaction id
     * @param provider Blockchain network provider
     */
    constructor(id: TransactionId, provider?: Provider) {
        this.id = id
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Transaction data
     */
    async getData(): Promise<any | null> {
        if (this.data !== null) {
            return this.data
        }
        try {
        } catch (error) {
            console.error('MC XRPl TX getData', error)
            throw new Error(ErrorTypeEnum.RPC_REQUEST_ERROR)
        }
    }

    /**
     * @param ms - Milliseconds to wait for the transaction to be confirmed. Default is 4000ms
     * @returns Status of the transaction
     */
    async wait(ms: number = 4000): Promise<TransactionStatusEnum> {
        return await new Promise((resolve, reject) => {
            const check = async (): Promise<void> => {
                try {
                    const status = await this.getStatus()
                    if (status === TransactionStatusEnum.CONFIRMED) {
                        resolve(TransactionStatusEnum.CONFIRMED)
                        return
                    } else if (status === TransactionStatusEnum.FAILED) {
                        reject(TransactionStatusEnum.FAILED)
                        return
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    console.error('MC XRPl TX wait', error)
                    reject(TransactionStatusEnum.FAILED)
                }
            }
            void check()
        })
    }

    /**
     * @returns Transaction ID
     */
    getId(): TransactionId {
        return this.id
    }

    /**
     * @returns Transaction type
     */
    async getType(): Promise<TransactionTypeEnum> {
        return TransactionTypeEnum.COIN
    }

    /**
     * @returns Transaction URL
     */
    getUrl(): string {
        return ''
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
        return ''
    }

    /**
     * @returns Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        return 0
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        return 0
    }

    /**
     * @returns Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        return 0
    }

    /**
     * @returns Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        return 0
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
