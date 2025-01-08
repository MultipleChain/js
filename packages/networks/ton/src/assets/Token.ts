import { Contract } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import type { TokenInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

export class Token extends Contract implements TokenInterface<TransactionSigner> {
    /**
     * @returns Token name
     */
    async getName(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Token symbol
     */
    async getSymbol(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return 18
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return 0
    }

    /**
     * @returns Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        return 0
    }

    /**
     * @param owner Address of owner of the tokens that is being used
     * @param spender Address of the spender that is using the tokens of owner
     * @returns Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(owner: WalletAddress, spender: WalletAddress): Promise<number> {
        return 0
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }

    /**
     * @param spender Address of the spender of transaction
     * @param owner Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of tokens that will be transferred
     * @returns Transaction signer
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
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param amount Amount of the tokens that will be used
     * @returns Transaction signer
     */
    async approve(
        owner: WalletAddress,
        spender: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }
}
