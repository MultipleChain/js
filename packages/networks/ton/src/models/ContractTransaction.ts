import { Address } from '@ton/core'
import { Transaction } from './Transaction'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        const address = (data?.action.details.asset ?? '') as string
        return Address.parse(address).toString(this.provider.contractStandard)
    }
}
