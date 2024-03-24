import type { TransactionSignerInterface, TransactionInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface {
    /**
     * Transaction data from the blockchain network
     */
    rawData: any

    /**
     * Signed transaction data
     */
    signedData?: any

    /**
     * @param rawData - Transaction data
     */
    constructor(rawData: any) {
        this.rawData = rawData
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     */
    async sign(privateKey: string): Promise<this> {
        return await Promise.resolve(this)
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Promise of the transaction
     */
    async send(): Promise<TransactionInterface | Error> {
        return await Promise.resolve(this.signedData)
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
