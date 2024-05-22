import { Transaction } from './Transaction.ts'
import type { Provider } from '../services/Provider.ts'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @param {ContractAddress} id Transaction id
     * @param {Provider} provider Blockchain network provider
     */
    constructor(id: ContractAddress, provider?: Provider) {
        super(id, provider)
        throw new Error('This class is not implemented for Bitcoin.')
    }

    /**
     * @returns {Promise<ContractAddress>} Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        return 'example'
    }
}
