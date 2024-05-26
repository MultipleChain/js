import { Contract } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import type { TokenInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

export class Token extends Contract implements TokenInterface<TransactionSigner> {
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
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of TOKEN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return 0
    }

    /**
     * @returns {Promise<number>} Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        return 0
    }

    /**
     * @param {WalletAddress} owner Address of owner of the tokens that is being used
     * @param {WalletAddress} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(owner: WalletAddress, spender: WalletAddress): Promise<number> {
        return 0
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param {WalletAddress} sender Sender wallet address
     * @param {WalletAddress} receiver Receiver wallet address
     * @param {TransferAmount} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }

    /**
     * @param {WalletAddress} spender Address of the spender of transaction
     * @param {WalletAddress} owner Sender wallet address
     * @param {WalletAddress} receiver Receiver wallet address
     * @param {TransferAmount} amount Amount of tokens that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: WalletAddress,
        owner: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {WalletAddress} owner Address of owner of the tokens that will be used
     * @param {WalletAddress} spender Address of the spender that will use the tokens of owner
     * @param {TransferAmount} amount Amount of the tokens that will be used
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(
        owner: WalletAddress,
        spender: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }
}
