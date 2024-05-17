import { fromSatoshi, sleep } from '../utils.ts'
import axios, { type AxiosError } from 'axios'
import { Provider } from '../services/Provider.ts'
import type { TransactionInterface } from '@multiplechain/types'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'

export interface VinObject {
    txid: string
    vout: number
    prevout: {
        scriptpubkey: string
        scriptpubkey_asm: string
        scriptpubkey_type: string
        scriptpubkey_address: string
        value: number
    }
    scriptsig: string
    scriptsig_asm: string
    witness: string[]
    is_coinbase: boolean
    sequence: number
}

export interface VoutObject {
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address: string
    value: number
}

export interface TransactionData {
    txid: string
    version: number
    locktime: number
    vin: VinObject[]
    vout: VoutObject[]
    size: number
    weight: number
    fee: number
    status: {
        confirmed: boolean
        block_height: number
        block_hash: string
        block_time: number
    }
}

let counter = 0

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
     * Transaction data
     */
    data: TransactionData | null = null

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
        if (this.data !== null) {
            return this.data
        }
        try {
            const data = (await axios.get(this.provider.createEndpoint('tx/' + this.id))).data

            if (data?.txid !== this.id) {
                this.data = null
            }

            return (this.data = data as TransactionData)
        } catch (error) {
            const axiosError = error as AxiosError
            // Returns empty data when the transaction is first created. For this reason, it would be better to check it intermittently and give an error if it still does not exist. Average 10 seconds.
            if (String(axiosError?.response?.data).includes('Transaction not found')) {
                if (counter > 5) {
                    throw new Error('Transaction not found')
                }
                counter++
                await sleep(2000)
                return await this.getData()
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
     * @returns {string} Transaction ID
     */
    getId(): string {
        return this.id
    }

    /**
     * @returns {string} Transaction URL
     */
    getUrl(): string {
        return this.provider.explorer + 'tx/' + this.id
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSigner(): Promise<string> {
        const data = await this.getData()
        return data?.vin[0].prevout.scriptpubkey_address ?? ''
    }

    /**
     * @returns {Promise<number>} Transaction fee
     */
    async getFee(): Promise<number> {
        const data = await this.getData()
        return fromSatoshi(data?.fee ?? 0)
    }

    /**
     * @returns {Promise<number>} Block number that transaction
     */
    async getBlockNumber(): Promise<number> {
        const data = await this.getData()
        return data?.status?.block_height ?? 0
    }

    /**
     * @returns {Promise<number>} Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<number> {
        const data = await this.getData()
        return data?.status?.block_time ?? 0
    }

    /**
     * @returns {Promise<number>} Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<number> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }
        const latestBlock = await axios.get(this.provider.createEndpoint('blocks/tip/height'))
        return (latestBlock.data as number) - data?.status?.block_height
    }

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data === null) {
            return TransactionStatusEnum.PENDING
        } else if (data.status?.block_height !== undefined) {
            if (data.status.confirmed) {
                return TransactionStatusEnum.CONFIRMED
            } else {
                return TransactionStatusEnum.FAILED
            }
        }
        return TransactionStatusEnum.PENDING
    }
}
