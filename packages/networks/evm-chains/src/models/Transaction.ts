import { Provider } from '../services/Provider.ts'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import type {
    BlockConfirmationCount,
    BlockNumber,
    BlockTimestamp,
    TransactionFee,
    TransactionId,
    TransactionInterface,
    WalletAddress
} from '@multiplechain/types'
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
    id: TransactionId

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
     * @param {TransactionId} id Transaction id
     * @param {Provider} provider Blockchain network provider
     */
    constructor(id: TransactionId, provider?: Provider) {
        this.id = id
        this.provider = provider ?? Provider.instance
        this.ethers = this.provider.ethers
    }

    /**
     * @returns {Promise<TransactionData | null>} Transaction data
     */
    async getData(): Promise<TransactionData | null> {
        if (this.data?.response !== undefined && this.data?.receipt !== null) {
            return this.data
        }
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

    /**
     * @param {number} ms - Milliseconds to wait for the transaction to be confirmed. Default is 4000ms
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
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
                    reject(TransactionStatusEnum.FAILED)
                }
            }
            void check()
        })
    }

    /**
     * @returns {TransactionId} Transaction id from the blockchain network
     */
    getId(): TransactionId {
        return this.id
    }

    /**
     * @returns {string} URL of the transaction on the blockchain explorer
     */
    getUrl(): string {
        let explorerUrl = this.provider.network.explorerUrl
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/'
        explorerUrl += 'tx/' + this.id
        return explorerUrl
    }

    /**
     * @returns {Promise<WalletAddress>} Signer wallet address of the transaction
     */
    async getSigner(): Promise<WalletAddress> {
        const data = await this.getData()
        return data?.response.from ?? ''
    }

    /**
     * @returns {Promise<TransactionFee>} Fee of the transaction
     */
    async getFee(): Promise<TransactionFee> {
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
     * @returns {Promise<BlockNumber>} Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        return data?.response.blockNumber ?? 0
    }

    /**
     * @returns {Promise<BlockTimestamp>} Timestamp of the block that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const blockNumber = await this.getBlockNumber()
        const block = await this.ethers.getBlock(blockNumber)
        return block?.timestamp ?? 0
    }

    /**
     * @returns {Promise<BlockConfirmationCount>} Confirmation count of the block that transaction
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const blockNumber = await this.getBlockNumber()
        const blockCount = await this.ethers.getBlockNumber()
        const confirmations = blockCount - blockNumber
        return confirmations < 0 ? 0 : confirmations
    }

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
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
