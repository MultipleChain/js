import { Transaction } from './Transaction'
import { SUI_TYPE_ARG } from '@mysten/sui/utils'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }
        for (const change of data.objectChanges ?? []) {
            if (change.type === 'published' || change.objectType.includes(SUI_TYPE_ARG)) {
                continue
            }
            const coinMatch = change.objectType.match(/0x2::coin::Coin<(.+)>/)
            return coinMatch?.[1] ? coinMatch[1] : change.objectType
        }

        return ''
    }
}
