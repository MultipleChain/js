import { Transaction } from './Transaction'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        return 'example'
    }
}
