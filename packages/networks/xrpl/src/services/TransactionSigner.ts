import { Provider } from '../services/Provider'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface<any, string> {
    /**
     * Transaction data from the blockchain network
     */
    rawData: any

    /**
     * Signed transaction data
     */
    signedData?: string

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param rawData - Transaction data
     * @param provider - Blockchain network provider
     */
    constructor(rawData: any, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @returns Signed transaction data
     */
    async sign(privateKey: PrivateKey): Promise<this> {
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
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
    getSignedData(): string {
        return this.signedData ?? ''
    }
}
