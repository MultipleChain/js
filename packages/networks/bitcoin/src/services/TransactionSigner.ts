import axios from 'axios'
import type { AxiosError } from 'axios'
import { Provider } from '../services/Provider.ts'
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import type { Transaction as TransactionData } from 'bitcore-lib'
import { type TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface {
    /**
     * Transaction data from the blockchain network
     */
    rawData: TransactionData

    /**
     * Signed transaction data
     */
    signedData?: string

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {TransactionData} rawData - Transaction data
     */
    constructor(rawData: TransactionData, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param {string} privateKey - Transaction data
     * @returns {Promise<TransactionSigner>} Signed transaction data
     */
    async sign(privateKey: string): Promise<TransactionSigner> {
        this.rawData.sign(privateKey)
        this.signedData = this.rawData.serialize()
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<Transaction>}
     */
    async send(): Promise<Transaction> {
        try {
            const result = await axios({
                method: 'POST',
                url: `https://blockstream.info/testnet/api/tx`,
                data: this.signedData
            })
            return new Transaction(result.data as string)
        } catch (error: any) {
            throw new Error(JSON.stringify((error as AxiosError).response?.data))
        }
    }

    /**
     * Get the raw transaction data
     * @returns Transaction data
     */
    getRawData(): TransactionData {
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
