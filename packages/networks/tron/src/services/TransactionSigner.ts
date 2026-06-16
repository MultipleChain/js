import { Provider } from '../services/Provider'
import {
    ErrorTypeEnum,
    type PrivateKey,
    type TransactionId,
    type TransactionSignerInterface
} from '@multiplechain/types'

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
    signature?: string[]
    [key: string]: unknown
}

export interface SignedTransactionData extends TransactionData {
    signature: string[]
}

export class TransactionSigner
    implements TransactionSignerInterface<TransactionData, SignedTransactionData>
{
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
        this.signedData = await this.provider.tronWeb.trx.sign(this.rawData, privateKey)
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
        const { transaction } = await this.provider.tronWeb.trx.sendRawTransaction(this.signedData)
        if (transaction === undefined) throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        return transaction.txID as string
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
