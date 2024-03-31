import { Provider } from '../services/Provider.ts'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { TransactionData } from '../services/TransactionSigner.ts'
import { ErrorTypeEnum, type CoinInterface } from '@multiplechain/types'

export class Coin implements CoinInterface {
    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {Provider} provider network provider
     */
    constructor(provider?: Provider) {
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Coin name
     */
    getName(): string {
        return (
            this.provider.network.nativeCurrency.name ?? this.provider.network.nativeCurrency.symbol
        )
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return this.provider.network.nativeCurrency.symbol
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return this.provider.network.nativeCurrency.decimals
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    async getBalance(owner: string): Promise<number> {
        const balance = await this.provider.ethers.getBalance(owner)
        return hexToNumber(balance.toString(), this.getDecimals())
    }

    /**
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    async transfer(sender: string, receiver: string, amount: number): Promise<TransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        if (amount > (await this.getBalance(sender))) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const hexAmount = numberToHex(amount, this.getDecimals())

        const txData: TransactionData = {
            data: '0x',
            to: receiver,
            from: sender,
            value: hexAmount,
            chainId: this.provider.network.id
        }

        const [gasPrice, nonce, gasLimit] = await Promise.all([
            this.provider.ethers.getGasPrice(),
            this.provider.ethers.getNonce(sender),
            this.provider.ethers.getEstimateGas(txData)
        ])

        txData.nonce = nonce
        txData.gasPrice = gasPrice
        txData.gasLimit = gasLimit

        return new TransactionSigner(txData)
    }
}
