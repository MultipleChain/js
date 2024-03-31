import { Transaction } from './Transaction.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns {Promise<string>} Contract address of the transaction
     */
    async getAddress(): Promise<string> {
        return 'example'
    }
}
