import { Provider } from '../services/Provider.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { CoinInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

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
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return 0
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
        return new TransactionSigner('example')
    }
}
