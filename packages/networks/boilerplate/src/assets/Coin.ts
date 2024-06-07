import { Provider } from '../services/Provider'
import { TransactionSigner } from '../services/TransactionSigner'
import type { CoinInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

export class Coin implements CoinInterface<TransactionSigner> {
    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param provider network provider
     */
    constructor(provider?: Provider) {
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Coin name
     */
    getName(): string {
        return 'example'
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return 'example'
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return 18
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return 0
    }

    /**
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
        return new TransactionSigner('example')
    }
}
