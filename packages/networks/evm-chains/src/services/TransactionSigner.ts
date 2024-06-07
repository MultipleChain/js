import type { EthersError } from './Ethers'
import { Provider } from '../services/Provider'
import type { TransactionRequest, Wallet, BigNumberish } from 'ethers'
import {
    ErrorTypeEnum,
    type PrivateKey,
    type TransactionId,
    type TransactionSignerInterface
} from '@multiplechain/types'

export interface TransactionData extends TransactionRequest {
    gas?: BigNumberish
}

export class TransactionSigner implements TransactionSignerInterface<TransactionData, string> {
    /**
     * Transaction data from the blockchain network
     */
    rawData: TransactionData

    /**
     * Signed transaction data
     */
    signedData: string

    /**
     * Wallet instance from ethers with the private key
     */
    wallet: Wallet

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param rawData Transaction data
     * @param provider Blockchain network provider
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
    public async sign(privateKey: PrivateKey): Promise<this> {
        try {
            this.wallet = this.provider.ethers.wallet(privateKey)
            this.signedData = await this.wallet.signTransaction(this.rawData)
            return this
        } catch (error) {
            const e = error as EthersError
            if (e?.shortMessage.includes('transaction from address mismatch')) {
                throw new Error(ErrorTypeEnum.INVALID_PRIVATE_KEY)
            }

            throw error
        }
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction data
     */
    async send(): Promise<TransactionId> {
        return (await this.provider.ethers.jsonRpc.send('eth_sendRawTransaction', [
            this.signedData
        ])) as TransactionId
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
        return this.signedData
    }
}
