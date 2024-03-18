import type { TransactionInterface } from '../models.ts'

/**
 * "any" is dependent on the blockchain network, it can be a string, object or any other type
 * so, you need define the type of the transaction data in your implementation
 */
export interface TransactionSignerInterface {
    /**
     * Transaction data from the blockchain network
     */
    rawData: any

    /**
     * Signed transaction data
     */
    signedData?: any

    /**
     * @param privateKey - Private key of the wallet to sign the transaction
     */
    sign: (privateKey: string) => Promise<TransactionSignerInterface>

    /**
     * @returns Send the transaction to the blockchain network, returns a promise of the transaction
     */
    send: () => Promise<TransactionInterface | Error>

    /**
     * @returns Unsigned transaction raw data
     */
    getRawData: () => any

    /**
     * @returns Signed transaction data
     */
    getSignedData: () => any
}
