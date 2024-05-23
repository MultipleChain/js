// eslint-disable-next-line
/// <reference path="tronweb.d.ts" />
import TronWebBase from 'tronweb'
import type { TransactionData } from './TransactionSigner.ts'
import type { TransactionRawData } from '../assets/Contract.ts'

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
