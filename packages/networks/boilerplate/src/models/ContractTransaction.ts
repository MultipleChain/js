import { Transaction } from './Transaction.ts'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns {Promise<ContractAddress>} Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        return 'example'
    }
}
