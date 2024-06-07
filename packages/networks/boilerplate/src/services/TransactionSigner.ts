import { Provider } from '../services/Provider'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface<unknown, unknown> {
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
     * @param rawData - Transaction data
     * @param provider - Blockchain network provider
     */
    constructor(rawData: unknown, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @returns Signed transaction data
     */
    async sign(privateKey: PrivateKey): Promise<this> {
        return await Promise.resolve(this)
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
        return await Promise.resolve('id')
    }

    /**
     * @returns raw transaction data
     */
    getRawData(): unknown {
        return this.rawData
    }

    /**
     * @returns signed transaction data
     */
    getSignedData(): unknown {
        return this.signedData
    }
}
