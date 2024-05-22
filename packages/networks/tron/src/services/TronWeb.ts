import TronWebBase from 'tronweb'
import type { TransactionRawData } from '../assets/Contract.ts'
import type { TransactionData } from './TransactionSigner.ts'

export class TronWeb extends TronWebBase {
    async triggerContract(data: TransactionRawData): Promise<TransactionData | false> {
        const response = await this.transactionBuilder.triggerSmartContract(
            data.address,
            data.method,
            data.options,
            data.parameters,
            data.from
        )

        // eslint-disable-next-line
        if (response?.result?.result !== true) {
            return false
        }

        return response.transaction as TransactionData
    }
}
