import { Contract } from './Contract.ts'
import type { TokenInterface } from '@multiplechain/types'
import { TokenTransactionSigner } from '../services/TransactionSigner.ts'

export class Token extends Contract implements TokenInterface {
    /**
     * @returns {Promise<string>} Token name
     */
    async getName(): Promise<string> {
        return 'example'
    }

    /**
     * @returns {Promise<string>} Token symbol
     */
    async getSymbol(): Promise<string> {
        return 'example'
    }

    /**
     * @returns {Promise<number>} Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return 18
    }

    /**
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of TOKEN
     */
    async getBalance(owner: string): Promise<number> {
        return 0
    }

    /**
     * @returns {Promise<number>} Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        return 0
    }

    /**
     * @param {string} owner Address of owner of the tokens that is being used
     * @param {string} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(owner: string, spender: string): Promise<number> {
        return 0
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param {string} sender Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<TokenTransactionSigner> {
        return new TokenTransactionSigner('example')
    }

    /**
     * @param {string} spender Address of the spender of transaction
     * @param {string} owner Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of tokens that will be transferred
     * @returns {Promise<TokenTransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        amount: number
    ): Promise<TokenTransactionSigner> {
        return new TokenTransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number} amount Amount of the tokens that will be used
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(owner: string, spender: string, amount: number): Promise<TokenTransactionSigner> {
        return new TokenTransactionSigner('example')
    }
}
