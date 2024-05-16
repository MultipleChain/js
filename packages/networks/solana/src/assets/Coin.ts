import { Provider } from '../services/Provider.ts'
import type { CoinInterface } from '@multiplechain/types'
import { CoinTransactionSigner } from '../services/TransactionSigner.ts'

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
        return 'example'
    }

    /**
     * @returns {string} Coin symbol
     */
    getSymbol(): string {
        return 'example'
    }

    /**
     * @returns {number} Decimal value of the coin
     */
    getDecimals(): number {
        return 18
    }

    /**
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: string): Promise<number> {
        return 0
    }

    /**
     * @param {string} sender Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<CoinTransactionSigner> {
        return new CoinTransactionSigner('example')
    }
}
