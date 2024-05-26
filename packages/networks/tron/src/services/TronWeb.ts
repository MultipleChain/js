import TronWebBase from 'tronweb'
import type { TransactionData } from './TransactionSigner'
import type { TransactionRawData } from '../assets/Contract'

export class TronWeb extends TronWebBase {
    /**
     * @param {TransactionRawData} data - Transaction data
     * @returns {Promise<TransactionData | false>} Transaction data
     */
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
