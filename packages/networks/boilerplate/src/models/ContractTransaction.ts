import { Transaction } from './Transaction.ts'
import type { ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    async getAddress(): Promise<string> {
        return 'example'
    }
}
