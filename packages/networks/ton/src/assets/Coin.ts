import { Provider } from '../services/Provider'
import { comment, fromNano, internal, toNano } from '@ton/core'
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
        return 'Toncoin'
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return 'TON'
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return 9
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const response = await this.provider.client3.getAddressInformation(owner)
        return Number(fromNano(response.balance))
    }

    /**
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     * @param body Comment for the transaction
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount,
        body?: string
    ): Promise<TransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        if (amount > (await this.getBalance(sender))) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        return new TransactionSigner(
            internal({
                bounce: false,
                to: receiver,
                value: toNano(amount),
                body: body ? comment(body) : undefined
            })
        )
    }
}
