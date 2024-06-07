import { Contract, type InterfaceAbi } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type ContractAddress,
    type TokenInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import type { Provider } from '../services/Provider'
import TRC20 from '../../resources/TRC20.json'

export class Token extends Contract implements TokenInterface<TransactionSigner> {
    /**
     * @param address Contract address
     * @param provider Blockchain network provider
     * @param ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? TRC20)
    }

    /**
     * @returns Token name
     */
    async getName(): Promise<string> {
        return (await this.callMethodWithCache('name')) as string
    }

    /**
     * @returns Token symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.callMethodWithCache('symbol')) as string
    }

    /**
     * @returns Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return (await this.callMethodWithCache('decimals')) as number
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const [decimals, balance] = await Promise.all([
            this.getDecimals(),
            this.callMethod('balanceOf', owner)
        ])
        return hexToNumber(balance as string, decimals)
    }

    /**
     * @returns Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        const [decimals, totalSupply] = await Promise.all([
            this.getDecimals(),
            this.callMethod('totalSupply')
        ])
        return hexToNumber(totalSupply as string, decimals)
    }

    /**
     * @param owner Address of owner of the tokens that is being used
     * @param spender Address of the spender that is using the tokens of owner
     * @returns Amount of tokens that the spender is allowed to spend
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
        if (amount <= 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(sender)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        const data = await this.createTransactionData('transfer', sender, receiver, hexAmount)
        data.options.feeLimit = 100000000

        const result = await this.provider.tronWeb.triggerContract(data)

        if (result === false) {
            throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        }

        return new TransactionSigner(result)
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

        const data = await this.createTransactionData(
            'transferFrom',
            spender,
            owner,
            receiver,
            hexAmount
        )

        data.options.feeLimit = 100000000

        const result = await this.provider.tronWeb.triggerContract(data)

        if (result === false) {
            throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        }

        return new TransactionSigner(result)
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
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(owner)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, await this.getDecimals())

        const data = await this.createTransactionData('approve', owner, spender, hexAmount)
        data.options.feeLimit = 100000000

        const result = await this.provider.tronWeb.triggerContract(data)

        if (result === false) {
            throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        }

        return new TransactionSigner(result)
    }
}
