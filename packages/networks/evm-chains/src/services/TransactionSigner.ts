import type { EthersError } from './Ethers.ts'
import { Provider } from '../services/Provider.ts'
import type { TransactionRequest, Wallet, BigNumberish } from 'ethers'
import {
    ErrorTypeEnum,
    TransactionTypeEnum,
    type TransactionSignerInterface
} from '@multiplechain/types'

// Transactions
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { ContractTransaction } from '../models/ContractTransaction.ts'

export interface TransactionData extends TransactionRequest {
    gas?: BigNumberish
}

export class TransactionSigner implements TransactionSignerInterface {
    /**
     * Transaction data from the blockchain network
     */
    rawData: TransactionData

    /**
     * Transaction type
     */
    type?: TransactionTypeEnum

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
     * @param {TransactionTypeEnum} type Transaction type
     */
    constructor(rawData: TransactionData, provider?: Provider, type?: TransactionTypeEnum) {
        this.type = type
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
        const txId = (await this.provider.ethers.jsonRpc.send('eth_sendRawTransaction', [
            this.signedData
        ])) as string
        switch (this.type) {
            case TransactionTypeEnum.COIN:
                return new CoinTransaction(txId)

            case TransactionTypeEnum.TOKEN:
                return new TokenTransaction(txId)

            case TransactionTypeEnum.NFT:
                return new NftTransaction(txId)

            case TransactionTypeEnum.CONTRACT:
                return new ContractTransaction(txId)

            default:
                return new Transaction(txId)
        }
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
