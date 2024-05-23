import { Provider } from '../services/Provider.ts'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { TransactionData } from '../services/TransactionSigner.ts'
import {
    ErrorTypeEnum,
    type CoinInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'

export class Coin implements CoinInterface<TransactionSigner> {
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
     * @returns {string} Coin name
     */
    getName(): string {
        return (
            this.provider.network.nativeCurrency.name ?? this.provider.network.nativeCurrency.symbol
        )
    }

    /**
     * @returns {string} Coin symbol
     */
    getSymbol(): string {
        return this.provider.network.nativeCurrency.symbol
    }

    /**
     * @returns {number} Decimal value of the coin
     */
    getDecimals(): number {
        return this.provider.network.nativeCurrency.decimals
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const balance = await this.provider.ethers.getBalance(owner)
        return hexToNumber(balance.toString(), this.getDecimals())
    }

    /**
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
