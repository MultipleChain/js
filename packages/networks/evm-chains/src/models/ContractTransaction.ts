import { Transaction } from './Transaction'
import type {
    ContractAddress,
    ContractTransactionInterface,
    TransactionId
} from '@multiplechain/types'
import {
    Interface,
    type InterfaceAbi,
    type TransactionResponse,
    type TransactionDescription
} from 'ethers'
import type { Provider } from '../services/Provider'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @type {InterfaceAbi}
     */
    ABI: InterfaceAbi

    /**
     * @param {TransactionId} id Transaction id
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(id: TransactionId, provider?: Provider, ABI?: InterfaceAbi) {
        super(id, provider)
        this.ABI = ABI ?? []
    }

    /**
     * @returns {Promise<ContractAddress>} Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
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
