import type { TransactionInterface } from '../models.ts'

/**
 * "any" is dependent on the blockchain network, it can be a string, object or any other type
 * so, you need define the type of the transaction data in your implementation
 */
export default interface TransactionSignerInterface {
    /**
     * Transaction data from the blockchain network
     */
    transaction: any

    /**
     * @param transaction - Transaction data from the blockchain network
     */
    constructor: (transaction: any) => void

    /**
     * @param privateKey - Private key of the wallet to sign the transaction
     */
    sign: (privateKey: string) => TransactionSignerInterface

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
