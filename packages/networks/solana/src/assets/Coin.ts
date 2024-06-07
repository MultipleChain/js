import { Provider } from '../services/Provider'
import { fromLamports, toLamports } from '../utils'
import { TransactionSigner } from '../services/TransactionSigner'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
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
        return 'Solana'
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return 'SOL'
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
        return fromLamports(await this.provider.web3.getBalance(new PublicKey(owner)))
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

        const lamports = toLamports(amount)
        const senderPubKey = new PublicKey(sender)
        const receiverPubKey = new PublicKey(receiver)

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderPubKey,
                toPubkey: receiverPubKey,
                lamports
            })
        )

        transaction.feePayer = senderPubKey

        return new TransactionSigner(transaction)
    }
}
