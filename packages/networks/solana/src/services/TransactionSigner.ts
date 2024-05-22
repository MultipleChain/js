import { Provider } from '../services/Provider.ts'
import { base58Decode } from '@multiplechain/utils'
import { Transaction } from '../models/Transaction.ts'
import type { TransactionSignerInterface } from '@multiplechain/types'
import { Keypair, VersionedTransaction, Transaction as RawTransaction } from '@solana/web3.js'

type SignedTransaction = Buffer | Uint8Array

export class TransactionSigner<ReturnTransaction>
    implements TransactionSignerInterface<RawTransaction, SignedTransaction, ReturnTransaction>
{
    /**
     * Transaction data from the blockchain network
     */
    rawData: RawTransaction

    /**
     * Signed transaction data
     */
    signedData: SignedTransaction

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {RawTransaction} rawData - Transaction data
     */
    constructor(rawData: RawTransaction, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param {string} privateKey - Transaction data
     * @returns {Promise<this>} Signed transaction data
     */
    async sign(privateKey: string): Promise<this> {
        this.rawData.recentBlockhash = (
            await this.provider.web3.getLatestBlockhash('finalized')
        ).blockhash

        const serialized = this.rawData.serialize({
            requireAllSignatures: false,
            verifySignatures: true
        })

        const feePayer = Keypair.fromSecretKey(base58Decode(privateKey))
        const transaction = this.getRawTransaction(serialized.toString('base64'))

        if (transaction instanceof VersionedTransaction) {
            transaction.sign([feePayer])
        } else {
            transaction.partialSign(feePayer)
        }

        this.signedData = transaction.serialize()

        return this
    }

    /**
     * Get the raw transaction data
     * @returns Transaction data
     */
    private getRawTransaction(encodedTransaction: string): RawTransaction | VersionedTransaction {
        let recoveredTransaction: RawTransaction | VersionedTransaction
        try {
            recoveredTransaction = RawTransaction.from(Buffer.from(encodedTransaction, 'base64'))
        } catch (error) {
            recoveredTransaction = VersionedTransaction.deserialize(
                Buffer.from(encodedTransaction, 'base64')
            )
        }
        return recoveredTransaction
    }

    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<ReturnTransaction>}
     */
    async send(): Promise<ReturnTransaction> {
        return new Transaction(
            await this.provider.web3.sendRawTransaction(this.signedData)
        ) as ReturnTransaction
    }

    /**
     * Get the raw transaction data
     * @returns Transaction data
     */
    getRawData(): RawTransaction {
        return this.rawData
    }

    /**
     * Get the signed transaction data
     * @returns Signed transaction data
     */
    getSignedData(): SignedTransaction {
        return this.signedData
    }
}
