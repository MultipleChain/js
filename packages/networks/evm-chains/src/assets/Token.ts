import { Contract } from './Contract.ts'
import type { InterfaceAbi } from 'ethers'
import ERC20 from '../../resources/erc20.json'
import type { Provider } from '../services/Provider.ts'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import { TokenTransactionSigner } from '../services/TransactionSigner.ts'
import { ErrorTypeEnum, type TokenInterface } from '@multiplechain/types'

export class Token extends Contract implements TokenInterface {
    /**
     * @param {string} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: string, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? ERC20)
    }

    /**
     * @returns {Promise<string>} Token name
     */
    async getName(): Promise<string> {
        return await this.callMethod('name')
    }

    /**
     * @returns {Promise<string>} Token symbol
     */
    async getSymbol(): Promise<string> {
        return await this.callMethod('symbol')
    }

    /**
     * @returns {Promise<number>} Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return Number(await this.callMethod('decimals'))
    }

    /**
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of TOKEN
     */
    async getBalance(owner: string): Promise<number> {
        const [decimals, balance] = await Promise.all([
            this.getDecimals(),
            this.callMethod('balanceOf', owner)
        ])
        return hexToNumber(balance as string, decimals)
    }

    /**
     * @returns {Promise<number>} Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        const [decimals, totalSupply] = await Promise.all([
            this.getDecimals(),
            this.callMethod('totalSupply')
        ])
        return hexToNumber(totalSupply as string, decimals)
    }

    /**
     * @param {string} owner Address of owner of the tokens that is being used
     * @param {string} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(owner: string, spender: string): Promise<number> {
        const [decimals, allowance] = await Promise.all([
            this.getDecimals(),
            await this.callMethod('allowance', owner, spender)
        ])
        return hexToNumber(allowance as string, decimals)
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
        if (amount <= 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(sender)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        return new TokenTransactionSigner(
            await this.createTransactionData('transfer', sender, receiver, hexAmount)
        )
    }

    /**
     * @param {string} spender Address of the spender of transaction
     * @param {string} owner Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of tokens that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        amount: number
    ): Promise<TokenTransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(owner)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const allowance = await this.getAllowance(owner, spender)

        if (allowance === 0) {
            throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
        }

        if (amount > allowance) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        return new TokenTransactionSigner(
            await this.createTransactionData('transferFrom', spender, owner, receiver, hexAmount)
        )
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number} amount Amount of the tokens that will be used
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(owner: string, spender: string, amount: number): Promise<TokenTransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(owner)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        return new TokenTransactionSigner(
            await this.createTransactionData('approve', owner, spender, hexAmount)
        )
    }
}
