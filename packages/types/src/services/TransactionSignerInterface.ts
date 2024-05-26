import type { PrivateKey, TransactionId } from '../defines'

export interface TransactionSignerInterface<RawData, SignedData> {
    /**
     * Transaction data type from the blockchain network
     */
    rawData: RawData

    /**
     * Signed transaction data type from the blockchain network
     */
    signedData?: SignedData

    /**
     * @param {PrivateKey} privateKey - Private key of the wallet to sign the transaction
     */
    sign: (privateKey: PrivateKey) => Promise<this>

    /**
     * @returns {Promise<TransactionId>} Send the transaction to the blockchain network, returns a promise of the transaction
     */
    send: () => Promise<TransactionId>

    /**
     * @returns {RawData} Unsigned transaction raw data
     */
    getRawData: () => RawData

    /**
     * @returns {SignedData} Signed transaction data
     */
    getSignedData: () => SignedData
}
