import { Provider } from '../services/Provider.ts'
import type { TransactionRequest, Wallet, BigNumberish } from 'ethers'
import { TransactionTypeEnum, type TransactionSignerInterface } from '@multiplechain/types'

// Transactions
import { Transaction } from '../models/Transaction.ts'
import { NftTransaction } from '../models/NftTransaction.ts'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { TokenTransaction } from '../models/TokenTransaction.ts'
import { ContractTransaction } from '../models/ContractTransaction.ts'

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
     * Transaction type
     */
    type: TransactionTypeEnum

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
    constructor(rawData: TransactionData, type?: TransactionTypeEnum) {
        this.rawData = rawData
        if (type !== undefined) this.type = type
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
        switch (this.type) {
            case TransactionTypeEnum.COIN:
                return new CoinTransaction(
                    (await ethers.jsonRpc.send('eth_sendRawTransaction', [
                        this.signedData
                    ])) as string
                )

            case TransactionTypeEnum.TOKEN:
                return new TokenTransaction(
                    (await ethers.jsonRpc.send('eth_sendRawTransaction', [
                        this.signedData
                    ])) as string
                )

            case TransactionTypeEnum.NFT:
                return new NftTransaction(
                    (await ethers.jsonRpc.send('eth_sendRawTransaction', [
                        this.signedData
                    ])) as string
                )

            case TransactionTypeEnum.CONTRACT:
                return new ContractTransaction(
                    (await ethers.jsonRpc.send('eth_sendRawTransaction', [
                        this.signedData
                    ])) as string
                )

            default:
                return new Transaction(
                    (await ethers.jsonRpc.send('eth_sendRawTransaction', [
                        this.signedData
                    ])) as string
                )
        }
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
