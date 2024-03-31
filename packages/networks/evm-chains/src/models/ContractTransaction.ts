import { Transaction } from './Transaction.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'
import {
    Interface,
    type InterfaceAbi,
    type TransactionResponse,
    type TransactionDescription
} from 'ethers'
import type { Provider } from '../services/Provider.ts'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @type {InterfaceAbi}
     */
    ABI: InterfaceAbi

    /**
     * @param {string} id Transaction id
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(id: string, provider?: Provider, ABI?: InterfaceAbi) {
        super(id, provider)
        this.ABI = ABI ?? []
    }

    /**
     * @returns {Promise<string>} Contract address of the transaction
     */
    async getAddress(): Promise<string> {
        const data = await this.getData()
        return data?.response.to ?? ''
    }

    /**
     * @param {TransactionResponse} response Transaction response
     * @returns {Promise<TransactionDescription | null>} Decoded transaction data
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
