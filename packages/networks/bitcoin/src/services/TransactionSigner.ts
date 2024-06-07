import axios from 'axios'
import type { AxiosError } from 'axios'
import { Provider } from '../services/Provider'
import type { Transaction as BitcoreLibTransactionData } from 'bitcore-lib'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export interface TransactionData {
    sender: string
    receiver: string
    amount: number
    bitcoreLib: BitcoreLibTransactionData
}

export class TransactionSigner implements TransactionSignerInterface<TransactionData, string> {
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
     * @param rawData - Transaction data
     * @param provider - Blockchain network provider
     */
    constructor(rawData: TransactionData, provider?: Provider) {
        this.rawData = rawData
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @returns Signed transaction data
     */
    async sign(privateKey: PrivateKey): Promise<this> {
        this.rawData.bitcoreLib.sign(privateKey)
        this.signedData = this.rawData.bitcoreLib.serialize()
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
        try {
            const result = await axios({
                method: 'POST',
                url: this.provider.createEndpoint('tx'),
                data: this.signedData
            })
            return result.data as TransactionId
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
