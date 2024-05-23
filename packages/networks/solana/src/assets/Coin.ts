import { Provider } from '../services/Provider.ts'
import { fromLamports, toLamports } from '../utils.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
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
     * @param {Provider} provider network provider
     */
    constructor(provider?: Provider) {
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {string} Coin name
     */
    getName(): string {
        return 'Solana'
    }

    /**
     * @returns {string} Coin symbol
     */
    getSymbol(): string {
        return 'SOL'
    }

    /**
     * @returns {number} Decimal value of the coin
     */
    getDecimals(): number {
        return 9
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return fromLamports(await this.provider.web3.getBalance(new PublicKey(owner)))
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
