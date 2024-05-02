import { Provider } from '../services/Provider.ts'
import { CoinTransactionSigner, type TransactionData } from '../services/TransactionSigner.ts'
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
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: string): Promise<number> {
        const balance = await this.provider.tronWeb.trx.getBalance(owner)
        return parseFloat(this.provider.tronWeb.fromSun(balance) as unknown as string)
    }

    /**
     * @param {string} sender Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<CoinTransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<CoinTransactionSigner> {
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

        return new CoinTransactionSigner(
            (await this.provider.tronWeb.transactionBuilder.sendTrx(
                receiver,
                sunFormat,
                sender
            )) as TransactionData
        )
    }
}
