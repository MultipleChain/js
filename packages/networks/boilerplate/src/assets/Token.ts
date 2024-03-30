import { Contract } from './Contract.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { TokenInterface, TransactionSignerInterface } from '@multiplechain/types'

export class Token extends Contract implements TokenInterface {
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
     * @returns Decimal value of the coin
     */
    async getDecimals(): Promise<number> {
        return 18
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    async getBalance(owner: string): Promise<number> {
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
     * @returns Amount of the tokens that is being used by spender
     */
    async getAllowance(owner: string, spender: string): Promise<number> {
        return 0
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }

    /**
     * @param spender Address of the spender of transaction
     * @param owner Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of tokens that will be transferred
     * @override transfer() in AssetInterface
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        amount: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param amount Amount of the tokens that will be used
     */
    async approve(
        owner: string,
        spender: string,
        amount: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }
}
