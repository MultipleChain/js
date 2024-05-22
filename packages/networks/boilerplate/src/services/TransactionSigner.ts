import { Provider } from '../services/Provider.ts'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface<any, any>{
    /**
     * Transaction data from the blockchain network
     */
    rawData: any

    /**
     * Signed transaction data
     */
    signedData: any

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {any} rawData - Transaction data
     */
    constructor(rawData: any, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param {PrivateKey} privateKey - Transaction data
     * @returns {Promise<this>} Signed transaction data
     */
    async sign(privateKey: PrivateKey): Promise<this> {
        return await Promise.resolve(this)
    }

    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<TransactionId>}
     */
    async send(): Promise<TransactionId> {
        return await Promise.resolve('id')
    }

    /**
     * Get the raw transaction data
     * @returns Transaction data
     */
    getRawData(): any {
        return this.rawData
    }

    /**
     * Get the signed transaction data
     * @returns Signed transaction data
     */
    getSignedData(): any {
        return this.signedData
    }
}
