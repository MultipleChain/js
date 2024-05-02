import { Provider } from '../services/Provider.ts'
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { ErrorTypeEnum, type TransactionSignerInterface } from '@multiplechain/types'

interface ParameterInterface {
    value: {
        data: string
        token_id: number
        owner_address: string
        call_token_value: number
        contract_address: string
    }
    type_url: string
}

interface ContractDataInterface {
    parameter: ParameterInterface
    type: string
}

export interface TransactionData {
    visible: boolean
    txID: string
    raw_data: {
        contract: ContractDataInterface[]
        ref_block_bytes: string
        ref_block_hash: string
        expiration: number
        fee_limit: number
        timestamp: number
    }
    raw_data_hex: string
}

export interface SignedTransactionData extends TransactionData {
    signature: string[]
}

export class TransactionSigner implements TransactionSignerInterface {
    /**
     * Transaction data from the blockchain network
     */
    rawData: TransactionData

    /**
     * Signed transaction data
     */
    signedData: SignedTransactionData

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
        this.signedData = await this.provider.tronWeb.trx.sign(this.rawData, privateKey)
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns {Promise<Transaction>}
     */
    async send(): Promise<Transaction> {
        const { transaction } = await this.provider.tronWeb.trx.sendRawTransaction(this.signedData)
        if (transaction === undefined) throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        return new Transaction(transaction.txID as string)
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
    getSignedData(): SignedTransactionData {
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
