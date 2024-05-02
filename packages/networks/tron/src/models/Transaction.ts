import { Provider } from '../services/Provider.ts'
import type { TransactionInterface } from '@multiplechain/types'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'

interface RetObject {
    contractRet: string
}

interface ContractObject {
    parameter: {
        value: {
            data: string
            owner_address: string
            contract_address: string
        }
        type_url: string
    }
    type: string
}

interface LogObject {
    address: string
    topics: string[]
    data: string
}

interface TransactionData {
    ret: RetObject[]
    signature: string[]
    txID: string
    raw_data: {
        contract: ContractObject[]
        ref_block_bytes: string
        ref_block_hash: string
        expiration: number
        fee_limit: number
        timestamp: number
    }
    raw_data_hex: string
    info?: {
        id: string
        fee: number
        blockNumber: number
        blockTimeStamp: number
        contractResult: string[]
        contract_address: string
        receipt: {
            net_usage: number
            energy_usage: number
            energy_usage_total: number
            energy_penalty_total: number
            result: string
        }
        log: LogObject[]
    }
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
     * Transaction data after completed
     */
    data: TransactionData

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
    async getData(): Promise<TransactionData | null> {
        try {
            if (this.data?.info !== undefined) {
                return this.data
            }
            this.data = await this.provider.tronWeb.trx.getTransaction(this.id)
            if (this.data === null) {
                return null
            }
            this.data.info = await this.provider.tronWeb.trx.getTransactionInfo(this.id)
            return this.data
        } catch (error) {
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
     * @returns {string} Transaction ID
     */
    getId(): string {
        return this.id
    }

    /**
     * @returns {string} Transaction URL
     */
    getUrl(): string {
        let explorerUrl = this.provider.node.explorer
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/'
        explorerUrl += '#/transaction/' + this.id
        return explorerUrl
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
        const data = await this.getData()
        if (data === null) {
            return TransactionStatusEnum.PENDING
        } else if (data?.ret.length > 0 && data.info !== null) {
            if (this.data.info?.blockNumber !== undefined) {
                if (this.data.ret[0].contractRet === 'REVERT') {
                    return TransactionStatusEnum.FAILED
                } else if (this.data.info.receipt.result === 'FAILED') {
                    return TransactionStatusEnum.FAILED
                } else {
                    return TransactionStatusEnum.CONFIRMED
                }
            }
        }
        return TransactionStatusEnum.PENDING
    }
}
