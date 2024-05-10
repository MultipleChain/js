import { Transaction } from './Transaction.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @param {string} id Contract address
     */
    constructor(id: string) {
        super(id)
        throw new Error('This class is not implemented for Bitcoin.')
    }

    /**
     * @returns {Promise<string>} Contract address of the transaction
     */
    async getAddress(): Promise<string> {
        return 'example'
    }
}
