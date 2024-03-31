import { Transaction } from './Transaction.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'
import { Interface, type TransactionDescription, type TransactionResponse } from 'ethers'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns {Promise<string>}
     */
    async getAddress(): Promise<string> {
        const data = await this.getData()
        return data?.response.to ?? ''
    }

    /**
     * @param {object[]} abiArray
     * @param {TransactionResponse} response
     * @returns {Promise<TransactionDescription | null>}
     */
    async decodeDataBase(
        abiArray: object[],
        response?: TransactionResponse
    ): Promise<TransactionDescription | null> {
        if (response === undefined) {
            const data = await this.getData()
            if (data === null) return null
            response = data.response
        }

        const iface = new Interface(abiArray)
        return iface.parseTransaction({
            data: response.data ?? '',
            value: response.value ?? 0
        })
    }
}
