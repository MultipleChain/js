import { Transaction } from './Transaction.ts'
import { Interface, type TransactionDescription } from 'ethers'
import type { ContractTransactionInterface } from '@multiplechain/types'

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
     * @returns {Promise<any>}
     */
    async decodeData(abiArray: object[]): Promise<TransactionDescription | null> {
        const data = await this.getData()
        if (data === null) return null
        const iface = new Interface(abiArray)
        return iface.parseTransaction({
            data: data?.response.data ?? '',
            value: data?.response.value ?? 0
        })
    }
}
