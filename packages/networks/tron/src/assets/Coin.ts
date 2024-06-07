import { Provider } from '../services/Provider'
import {
    ErrorTypeEnum,
    type CoinInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { TransactionSigner, type TransactionData } from '../services/TransactionSigner'

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
        return 'Tron'
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return 'TRX'
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
        const balance = await this.provider.tronWeb.trx.getBalance(owner)
        return parseFloat(this.provider.tronWeb.fromSun(balance) as unknown as string)
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
