import { Contract } from './Contract'
import type { InterfaceAbi } from 'ethers'
import ERC20 from '../../resources/ERC20.json'
import type { Provider } from '../services/Provider'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type ContractAddress,
    type TokenInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'

export class Token extends Contract implements TokenInterface<TransactionSigner> {
    /**
     * @param {ContractAddress} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? ERC20)
    }

    /**
     * @returns {Promise<string>} Token name
     */
    async getName(): Promise<string> {
        return (await this.callMethodWithCache('name')) as string
    }

    /**
     * @returns {Promise<string>} Token symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.callMethodWithCache('symbol')) as string
    }

    /**
     * @returns {Promise<number>} Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return Number(await this.callMethodWithCache('decimals'))
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of TOKEN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
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
     * @param {WalletAddress} owner Address of owner of the tokens that is being used
     * @param {WalletAddress} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(owner: WalletAddress, spender: WalletAddress): Promise<number> {
        const [decimals, allowance] = await Promise.all([
            this.getDecimals(),
            await this.callMethod('allowance', owner, spender)
        ])
        return hexToNumber(allowance as string, decimals)
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
        if (amount <= 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(sender)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        return new TransactionSigner(
            await this.createTransactionData('transfer', sender, receiver, hexAmount)
        )
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

        return new TransactionSigner(
            await this.createTransactionData('transferFrom', spender, owner, receiver, hexAmount)
        )
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
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(owner)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        return new TransactionSigner(
            await this.createTransactionData('approve', owner, spender, hexAmount)
        )
    }
}
