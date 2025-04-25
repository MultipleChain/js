import { Provider } from '../services/Provider'
import type { Transaction } from '@mysten/sui/transactions'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import type { SignatureWithBytes } from '@mysten/sui/cryptography'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner
    implements TransactionSignerInterface<Transaction, SignatureWithBytes>
{
    /**
     * Transaction data from the blockchain network
     */
    rawData: Transaction

    /**
     * Signed transaction data
     */
    signedData: SignatureWithBytes

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param rawData - Transaction data
     * @param provider - Blockchain network provider
     */
    constructor(rawData: Transaction, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @returns Signed transaction data
     */
    async sign(privateKey: PrivateKey): Promise<this> {
        const keypair = Ed25519Keypair.fromSecretKey(privateKey)
        this.rawData.setSenderIfNotSet(keypair.toSuiAddress())
        this.signedData = await keypair.signTransaction(
            await this.rawData.build({ client: this.provider.client })
        )
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
        const { digest } = await this.provider.client.executeTransactionBlock({
            transactionBlock: this.signedData.bytes,
            signature: this.signedData.signature
        })
        return digest
    }

    /**
     * @returns raw transaction data
     */
    getRawData(): Transaction {
        return this.rawData
    }

    /**
     * @returns signed transaction data
     */
    getSignedData(): SignatureWithBytes {
        return this.signedData
    }
}
