import { Provider } from '../services/Provider.ts'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import type { TransactionInterface } from '@multiplechain/types'
import type { TransactionReceipt, TransactionResponse } from 'ethers'
import type { Ethers } from '../services/Ethers.ts'
import { hexToNumber } from '@multiplechain/utils'

interface TransactionData {
    response: TransactionResponse
    receipt: TransactionReceipt | null
}

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
     * Ethers service
     */
    ethers: Ethers

    /**
     * Transaction data after completed
     */
    data: TransactionData

    /**
     * @param id Transaction ID
     */
    constructor(id: string) {
        this.id = id
        this.provider = Provider.instance
        this.ethers = Provider.instance.ethers
    }

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    async getData(): Promise<TransactionData | null> {
        if (this.data?.response !== undefined && this.data?.receipt !== null) {
            return this.data
        }
        console.log('getData', this.id)
        try {
            const response = await this.ethers.getTransaction(this.id)
            if (response === null) {
                return null
            }
            const receipt = await this.ethers.getTransactionReceipt(this.id)
            return (this.data = { response, receipt })
        } catch (error) {
            if (error instanceof Error && String(error.message).includes('timeout')) {
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
            void check()
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
        let explorerUrl = this.provider.network.explorerUrl
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/'
        explorerUrl += 'tx/' + this.id
        return explorerUrl
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<string> {
        const data = await this.getData()
        return data?.response.from ?? ''
    }

    /**
     * @returns Transaction fee as native coin amount
     */
    async getFee(): Promise<number> {
        const data = await this.getData()
        if (data?.response?.gasPrice === undefined || data?.receipt?.gasUsed === undefined) {
            return 0
        }
        return hexToNumber(
            (data?.response.gasPrice * data?.receipt.gasUsed).toString(),
            this.provider.network.nativeCurrency.decimals
        )
    }

    /**
     * @returns Block ID of the transaction
     */
    async getBlockNumber(): Promise<number> {
        const data = await this.getData()
        return data?.response.blockNumber ?? 0
    }

    /**
     * @returns UNIX timestamp of the date that block is added to blockchain
     */
    async getBlockTimestamp(): Promise<number> {
        const blockNumber = await this.getBlockNumber()
        const block = await this.ethers.getBlock(blockNumber)
        return block?.timestamp ?? 0
    }

    /**
     * @returns Confirmation count of the block that transaction is included
     */
    async getBlockConfirmationCount(): Promise<number> {
        const blockNumber = await this.getBlockNumber()
        const blockCount = await this.ethers.getBlockNumber()
        const confirmations = blockCount - blockNumber
        return confirmations < 0 ? 0 : confirmations
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data === null) {
            return TransactionStatusEnum.PENDING
        } else if (data.response.blockNumber !== null && data.receipt !== null) {
            if (data.receipt.status === 1) {
                return TransactionStatusEnum.CONFIRMED
            } else {
                return TransactionStatusEnum.FAILED
            }
        }
        return TransactionStatusEnum.PENDING
    }
}
