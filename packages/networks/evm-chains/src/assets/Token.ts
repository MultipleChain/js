import { Contract } from './Contract.ts'
import ERC20 from '../../resources/erc20.json'
import { Provider } from '../services/Provider.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import type { TokenInterface } from '@multiplechain/types'

const { network, ethers } = Provider.instance

export class Token extends Contract implements TokenInterface {
    constructor(address: string) {
        super(address, ERC20)
    }

    /**
     * @returns Token name
     */
    async getName(): Promise<string> {
        return await this.callMethod('name')
    }

    /**
     * @returns Token symbol
     */
    async getSymbol(): Promise<string> {
        return await this.callMethod('symbol')
    }

    /**
     * @returns Decimal value of the coin
     */
    async getDecimals(): Promise<number> {
        return Number(await this.callMethod('decimals'))
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    async getBalance(owner: string): Promise<number> {
        const decimals = await this.getDecimals()
        const balance = await this.callMethod('balanceOf', owner)
        return hexToNumber(balance as string, decimals)
    }

    /**
     * @returns Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        const decimals = await this.getDecimals()
        const totalSupply = await this.callMethod('totalSupply')
        return hexToNumber(totalSupply as string, decimals)
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    async transfer(sender: string, receiver: string, amount: number): Promise<TransactionSigner> {
        if (amount < 0) {
            throw new Error('Invalid amount')
        }

        const [balance, decimals] = await Promise.all([this.getBalance(sender), this.getDecimals()])

        if (amount > balance) {
            throw new Error('Insufficient balance')
        }

        const hexAmount = numberToHex(amount, decimals)
        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(sender),
            this.getMethodData('transfer', receiver, hexAmount),
            this.getMethodEstimateGas('transfer', sender, receiver, hexAmount)
        ])

        return new TransactionSigner({
            data,
            nonce,
            gasPrice,
            gasLimit,
            value: '0x0',
            from: sender,
            chainId: network.id,
            to: this.getAddress()
        })
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param amount Amount of the tokens that will be used
     */
    async approve(owner: string, spender: string, amount: number): Promise<TransactionSigner> {
        if (amount < 0) {
            throw new Error('Invalid amount')
        }

        const [balance, decimals] = await Promise.all([this.getBalance(owner), this.getDecimals()])

        if (amount > balance) {
            throw new Error('Insufficient balance')
        }

        const hexAmount = numberToHex(amount, decimals)

        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(owner),
            this.getMethodData('approve', spender, hexAmount),
            this.getMethodEstimateGas('approve', owner, spender, hexAmount)
        ])

        return new TransactionSigner({
            data,
            nonce,
            gasPrice,
            gasLimit,
            value: '0x0',
            from: owner,
            chainId: network.id,
            to: this.getAddress()
        })
    }

    /**
     * @param owner Address of owner of the tokens that is being used
     * @param spender Address of the spender that is using the tokens of owner
     * @returns Amount of the tokens that is being used by spender
     */
    async allowance(owner: string, spender: string): Promise<number> {
        return hexToNumber(
            (await this.callMethod('allowance', owner, spender)) as string,
            await this.getDecimals()
        )
    }
}
