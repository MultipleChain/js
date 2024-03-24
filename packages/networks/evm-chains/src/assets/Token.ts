import { Contract } from './Contract.ts'
import ERC20 from '../../resources/erc20.json'
import { Provider } from '../services/Provider.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import { hexToNumber, numberToHex, toHex } from '@multiplechain/utils'
import type { TokenInterface, TransactionSignerInterface } from '@multiplechain/types'

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
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<TransactionSignerInterface> {
        if (amount < 0) {
            throw new Error('Invalid amount')
        }

        const [balance, decimals] = await Promise.all([this.getBalance(sender), this.getDecimals()])

        if (amount > balance) {
            throw new Error('Insufficient balance')
        }

        const hexAmount = numberToHex(amount, decimals)
        const [gasPrice, nonce, data, gas] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(sender),
            this.getMethodData('transfer', receiver, hexAmount),
            this.ethersContract.transfer.estimateGas(receiver, hexAmount, { from: sender })
        ])

        return new TransactionSigner({
            data,
            nonce,
            gasPrice,
            value: '0x0',
            to: receiver,
            from: sender,
            gas: toHex(gas),
            chainId: network.id,
            gasLimit: 22000
        })
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
