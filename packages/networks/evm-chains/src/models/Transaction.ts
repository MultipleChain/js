import { Provider } from '../services/Provider.ts'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import type { TransactionInterface } from '@multiplechain/types'
import type { TransactionReceipt, TransactionResponse } from 'ethers'
import type { Ethers } from '../services/Ethers.ts'

interface TransactionData {
    response: TransactionResponse
    receipt: TransactionReceipt
}

export class Transaction implements TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * Ethers service
     */
    ethers: Ethers

    constructor(id: string) {
        this.id = id
        this.ethers = Provider.instance.ethers
    }

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    async getData(): Promise<TransactionData | null> {
        try {
            const response = await this.ethers.getTransaction(this.id)
            if (response === null) {
                return null
            }
            const receipt = await this.ethers.getTransactionReceipt(this.id)
            if (receipt === null) {
                return null
            }
            return { response, receipt }
        } catch (error) {
            const e = error as Error
            if (String(e.message).includes('timeout')) {
                throw new Error(ErrorTypeEnum.RPC_TIMEOUT)
            }
            throw new Error(ErrorTypeEnum.RPC_REQUEST_ERROR)
        }
    }

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
                    reject(TransactionStatusEnum.FAILED)
                }
            }
            check() // eslint-disable-line @typescript-eslint/no-floating-promises
        })
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
        const data = await this.getData()
        if (data === null) {
            return TransactionStatusEnum.PENDING
        } else if (data.response.blockNumber !== null) {
            if (data.receipt.status === 1) {
                return TransactionStatusEnum.CONFIRMED
            } else {
                return TransactionStatusEnum.FAILED
            }
        }
        return TransactionStatusEnum.PENDING
    }
}
