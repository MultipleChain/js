import type { EthersError } from './Ethers.ts'
import { Provider } from '../services/Provider.ts'
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { ContractTransaction } from '../models/ContractTransaction.ts'
import type { TransactionRequest, Wallet, BigNumberish } from 'ethers'
import { ErrorTypeEnum, type TransactionSignerInterface } from '@multiplechain/types'

export interface TransactionData extends TransactionRequest {
    gas?: BigNumberish
}
export class TransactionSigner implements TransactionSignerInterface {
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
     * @param {TransactionData} rawData Transaction data
     * @param {Provider} provider Blockchain network provider
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
    public async sign(privateKey: string): Promise<TransactionSigner> {
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
     * @returns {Promise<Transaction>} Transaction data
     */
    async send(): Promise<Transaction> {
        return new Transaction(
            (await this.provider.ethers.jsonRpc.send('eth_sendRawTransaction', [
                this.signedData
            ])) as string
        )
    }

    /**
     * Get the raw transaction data
     * @returns {any} Transaction data
     */
    getRawData(): any {
        return this.rawData
    }

    /**
     * Get the signed transaction data
     * @returns {any} Signed transaction data
     */
    getSignedData(): any {
        return this.signedData
    }
}

export class ContractTransactionSigner extends TransactionSigner {
    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<ContractTransaction>} Transaction data
     */
    async send(): Promise<ContractTransaction> {
        return new ContractTransaction((await super.send()).getId())
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
