import { Provider } from '../services/Provider.ts'
import {
    ErrorTypeEnum,
    type CoinInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { TransactionSigner, type TransactionData } from '../services/TransactionSigner.ts'

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
        return 'Tron'
    }

    /**
     * @returns {string} Coin symbol
     */
    getSymbol(): string {
        return 'TRX'
    }

    /**
     * @returns {number} Decimal value of the coin
     */
    getDecimals(): number {
        return 6
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const balance = await this.provider.tronWeb.trx.getBalance(owner)
        return parseFloat(this.provider.tronWeb.fromSun(balance) as unknown as string)
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

        if (sender === receiver) {
            throw new Error(ErrorTypeEnum.INVALID_ADDRESS)
        }

        const sunFormat = this.provider.tronWeb.toSun(amount)

        return new TransactionSigner(
            (await this.provider.tronWeb.transactionBuilder.sendTrx(
                receiver,
                sunFormat,
                sender
            )) as TransactionData
        )
    }
}
