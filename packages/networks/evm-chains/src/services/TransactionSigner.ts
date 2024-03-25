import { Provider } from '../services/Provider.ts'
import { Transaction } from '../models/Transaction.ts'
import type { TransactionRequest, Wallet, BigNumberish } from 'ethers'
import type { TransactionSignerInterface } from '@multiplechain/types'

export interface TransactionData extends TransactionRequest {
    gas?: BigNumberish
}

const { ethers } = Provider.instance

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
     * @param rawData - Transaction data
     */
    constructor(rawData: TransactionData) {
        this.rawData = rawData
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     */
    public async sign(privateKey: string): Promise<TransactionSigner> {
        this.wallet = ethers.wallet(privateKey)
        this.signedData = await this.wallet.signTransaction(this.rawData)
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Promise of the transaction
     */
    async send(): Promise<Transaction> {
        return new Transaction(
            (await ethers.jsonRpc.send('eth_sendRawTransaction', [this.signedData])) as string
        )
    }

    /**
     * Get the raw transaction data
     * @returns Transaction data
     */
    getRawData(): any {
        return this.rawData
    }

    /**
     * Get the signed transaction data
     * @returns Signed transaction data
     */
    getSignedData(): any {
        return this.signedData
    }
}
