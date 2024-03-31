import { Transaction } from './Transaction.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'
import {
    Interface,
    type InterfaceAbi,
    type TransactionResponse,
    type TransactionDescription
} from 'ethers'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @type {InterfaceAbi}
     */
    ABI: InterfaceAbi

    /**
     * @param {string} hash
     * @param {InterfaceAbi} ABI
     */
    constructor(hash: string, ABI: InterfaceAbi = []) {
        super(hash)
        this.ABI = ABI
    }

    /**
     * @returns {Promise<string>}
     */
    async getAddress(): Promise<string> {
        const data = await this.getData()
        return data?.response.to ?? ''
    }

    /**
     * @param {TransactionResponse} response
     * @returns {Promise<TransactionDescription | null>}
     */
    async decodeData(response?: TransactionResponse): Promise<TransactionDescription | null> {
        if (response === undefined) {
            const data = await this.getData()
            if (data === null) return null
            response = data.response
        }

        return new Interface(this.ABI).parseTransaction({
            data: response.data ?? '',
            value: response.value ?? 0
        })
    }
}
