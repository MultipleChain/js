import { dropsToXrp, xrpToDrops } from 'xrpl'
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
        return dropsToXrp(await this.provider.rpc.getBalance(owner))
    }

    /**
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     * @param memo Memo for the transaction
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount,
        memo?: string
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

        const info = await this.provider.rpc.getAccountInfo(receiver)

        if (this.provider.rpc.isError(info) && info.error === 'actNotFound') {
            const minReserve = await this.provider.rpc.getMinimumReserve()
            if (amount < minReserve) {
                throw new Error(
                    `This account is not activated, so you have to send at least ${minReserve} XRP to activate it`
                )
            }
        }

        return new TransactionSigner({
            Account: sender,
            Destination: receiver,
            Amount: xrpToDrops(amount),
            TransactionType: 'Payment',
            Memos: memo ? [this.provider.createMemo(memo)] : []
        })
    }
}
