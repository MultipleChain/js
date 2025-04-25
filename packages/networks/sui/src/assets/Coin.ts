import { fromMist, tomMist } from '../utils'
import { Provider } from '../services/Provider'
import { SUI_DECIMALS } from '@mysten/sui/utils'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type CoinInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { Transaction } from '@mysten/sui/transactions'

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
        return 'Sui'
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return 'SUI'
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return SUI_DECIMALS
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const balance = await this.provider.client.getBalance({
            owner
        })
        return fromMist(balance.totalBalance)
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

        const tx = new Transaction()

        const [coin] = tx.splitCoins(tx.gas, [tomMist(amount)])

        tx.transferObjects([coin], receiver)

        return new TransactionSigner(tx)
    }
}
