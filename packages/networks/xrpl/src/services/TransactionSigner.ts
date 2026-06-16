import { Provider } from '../services/Provider'
import { type ECDSA, Wallet, type SubmittableTransaction } from 'xrpl'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export interface SignedTransaction {
    tx_blob: string
    hash: string
}

export type RawTransaction = SubmittableTransaction & {
    Destination?: string
    Amount?: string
}

export class TransactionSigner
    implements TransactionSignerInterface<RawTransaction, SignedTransaction>
{
    /**
     * Transaction data from the blockchain network
     */
    rawData: RawTransaction

    /**
     * Signed transaction data
     */
    signedData?: SignedTransaction

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param rawData - Transaction data
     * @param provider - Blockchain network provider
     */
    constructor(rawData: RawTransaction, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @param algorithm - Blockchain network provider
     * @returns Signed transaction data
     */
    async sign(privateKey: PrivateKey, algorithm?: ECDSA): Promise<this> {
        await this.provider.ws.connect()

        const senderWallet = Wallet.fromSeed(privateKey, {
            algorithm
        })

        this.rawData = await this.provider.ws.autofill(this.rawData)

        this.signedData = senderWallet.sign(this.rawData)

        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
        if (!this.signedData) {
            throw new Error('Transaction not signed')
        }

        const { result } = await this.provider.ws.submit(this.signedData.tx_blob)

        if (result.engine_result !== 'tesSUCCESS') {
            throw new Error(`Transaction failed: ${result.engine_result_message}`)
        }

        await this.provider.ws.disconnect()

        return this.signedData.hash
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
        return this.signedData ?? { tx_blob: '', hash: '' }
    }
}
