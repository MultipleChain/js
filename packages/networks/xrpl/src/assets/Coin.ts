import { Provider } from '../services/Provider'
import { TransactionSigner } from '../services/TransactionSigner'
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
     * @param provider network provider
     */
    constructor(provider?: Provider) {
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Coin name
     */
    getName(): string {
        return 'XRP'
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return 'XRP'
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return 6
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return await Promise.resolve(100)
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
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        if (amount > (await this.getBalance(sender))) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        if (sender === receiver) {
            throw new Error(ErrorTypeEnum.INVALID_ADDRESS)
        }

        return new TransactionSigner()
    }
}
