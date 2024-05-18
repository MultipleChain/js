import { Provider } from '../services/Provider.ts'
import { base58Decode } from '@multiplechain/utils'
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import type { TransactionSignerInterface } from '@multiplechain/types'
import { Keypair, VersionedTransaction, Transaction as RawTransaction } from '@solana/web3.js'

type SignedTransaction = Buffer | Uint8Array

export class TransactionSigner implements TransactionSignerInterface {
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
     * @returns {Promise<TransactionSigner>} Signed transaction data
     */
    async sign(privateKey: string): Promise<TransactionSigner> {
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
     * @returns {Promise<Transaction>}
     */
    async send(): Promise<Transaction> {
        return new Transaction(await this.provider.web3.sendRawTransaction(this.signedData))
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

export class CoinTransactionSigner extends TransactionSigner {
    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<CoinTransaction>} Transaction data
     */
    async send(): Promise<CoinTransaction> {
        return new CoinTransaction((await super.send()).getId())
    }
}

export class TokenTransactionSigner extends TransactionSigner {
    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<TokenTransaction>} Transaction data
     */
    async send(): Promise<TokenTransaction> {
        return new TokenTransaction((await super.send()).getId())
    }
}

export class NftTransactionSigner extends TransactionSigner {
    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<NftTransaction>} Transaction data
     */
    async send(): Promise<NftTransaction> {
        return new NftTransaction((await super.send()).getId())
    }
}
