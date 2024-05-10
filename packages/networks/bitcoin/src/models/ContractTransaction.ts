import { Transaction } from './Transaction.ts'
import type { Provider } from '../services/Provider.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @param {string} id Transaction id
     * @param {Provider} provider Blockchain network provider
     */
    constructor(id: string, provider?: Provider) {
        super(id, provider)
        throw new Error('This class is not implemented for Bitcoin.')
    }

    /**
     * @returns {Promise<string>} Contract address of the transaction
     */
    async getAddress(): Promise<string> {
        return 'example'
    }
}
