import { Provider } from '../services/Provider.ts'
import type { TransactionInterface } from '@multiplechain/types'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'

interface RetObject {
    contractRet: string
}

interface ContractObject {
    parameter: {
        value: {
            data?: string
            owner_address: string
            contract_address?: string
            to_address?: string
            amount?: number
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

export interface TransactionData {
    ret: RetObject[]
    signature: string[]
    txID: string
    raw_data: {
        contract: ContractObject[]
        ref_block_bytes: string
        ref_block_hash: string
        expiration: number
        timestamp: number
        fee_limit?: number
    }
    raw_data_hex: string
    info?: {
        id: string
        fee: number
        packingFee: number
        blockNumber: number
        blockTimeStamp: number
        contractResult: string[]
        contract_address?: string
        receipt: {
            result?: string
            net_fee: number
            net_usage?: number
            energy_usage?: number
            energy_usage_total?: number
            energy_penalty_total?: number
        }
        log?: LogObject[]
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
     * @returns {Promise<TransactionData | null>} Transaction data
     */
    async getData(): Promise<TransactionData | null> {
        try {
            if (this.data?.info !== undefined) {
                return this.data
            }
            this.data = (await this.provider.tronWeb.trx.getTransaction(this.id)) ?? undefined
            if (this.data === undefined) {
                return null
            }
            const result = await this.provider.tronWeb.trx.getTransactionInfo(this.id)
            this.data.info = result?.id !== undefined ? result : undefined
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
        const data = await this.getData()
        return this.provider.tronWeb.address.fromHex(
            data?.raw_data.contract[0].parameter.value.owner_address ?? ''
        )
    }

    /**
     * @returns {Promise<number>} Transaction fee
     */
    async getFee(): Promise<number> {
        const data = await this.getData()
        return parseFloat(this.provider.tronWeb.fromSun(data?.info?.fee ?? 0) as unknown as string)
    }

    /**
     * @returns {Promise<number>} Block number that transaction
     */
    async getBlockNumber(): Promise<number> {
        const data = await this.getData()
        return data?.info?.blockNumber ?? 0
    }

    /**
     * @returns {Promise<number>} Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<number> {
        const data = await this.getData()
        return parseInt((data?.info?.blockTimeStamp ?? 0).toString().replace(/0+$/, ''))
    }

    /**
     * @returns {Promise<number>} Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<number> {
        const data = await this.getData()
        const blockNumber = data?.info?.blockNumber ?? 0
        const latestBlock = await this.provider.tronWeb.trx.getCurrentBlock()
        return latestBlock.block_header.raw_data.number - blockNumber
    }

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data === null) {
            return TransactionStatusEnum.PENDING
        } else if (data?.ret.length > 0 && data.info !== undefined) {
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
