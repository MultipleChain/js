export interface TransactionSignerInterface<RawData, SignedData, Transaction> {
    /**
     * Transaction data from the blockchain network
     */
    rawData: RawData

    /**
     * Signed transaction data
     */
    signedData?: SignedData

    /**
     * @param {string} privateKey - Private key of the wallet to sign the transaction
     */
    sign: (privateKey: string) => Promise<this>

    /**
     * @returns {Promise<Transaction | Error>} Send the transaction to the blockchain network, returns a promise of the transaction
     */
    send: () => Promise<Transaction | Error>

    /**
     * @returns {RawData} Unsigned transaction raw data
     */
    getRawData: () => RawData

    /**
     * @returns {SignedData} Signed transaction data
     */
    getSignedData: () => SignedData
}
