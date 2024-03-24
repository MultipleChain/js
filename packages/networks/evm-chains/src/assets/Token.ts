import { Contract } from './Contract.ts'
import ERC20 from '../../resources/erc20.json'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { TokenInterface, TransactionSignerInterface } from '@multiplechain/types'

export class Token extends Contract implements TokenInterface {
    /**
     * @returns Token name
     */
    getName(): string {
        return 'example'
    }

    /**
     * @returns Token symbol
     */
    getSymbol(): string {
        return 'example'
    }

    /**
     * @returns Contract address
     */
    getAddress(): string {
        return 'example'
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return 18
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    getBalance(owner: string): number {
        return 0
    }

    /**
     * @returns Total supply of the token
     */
    getTotalSupply(): number {
        return 0
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    transfer(sender: string, receiver: string, amount: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param amount Amount of the tokens that will be used
     */
    approve(owner: string, spender: string, amount: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }

    /**
     * @param owner Address of owner of the tokens that is being used
     * @param spender Address of the spender that is using the tokens of owner
     * @returns Amount of the tokens that is being used by spender
     */
    allowance(owner: string, spender: string): number {
        return 0
    }
}
