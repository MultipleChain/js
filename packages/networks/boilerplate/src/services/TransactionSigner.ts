import { Provider } from '../services/Provider'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface<unknown, unknown>{
    /**
     * Transaction data from the blockchain network
     */
    rawData: unknown

    /**
     * Signed transaction data
     */
    signedData: unknown

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {unknown} rawData - Transaction data
     * @param {Provider} provider - Blockchain network provider
     */
    constructor(rawData: unknown, provider?: Provider) {
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
     * @returns {unknown}
     */
    getRawData(): unknown {
        return this.rawData
    }

    /**
     * Get the signed transaction data
     * @returns {unknown}
     */
    getSignedData(): unknown {
        return this.signedData
    }
}
