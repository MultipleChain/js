import { Provider } from '../services/Provider.ts'
import { fromLamports, toLamports } from '../utils.ts'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { ErrorTypeEnum, type CoinInterface } from '@multiplechain/types'
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
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: string): Promise<number> {
        return fromLamports(await this.provider.web3.getBalance(new PublicKey(owner)))
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

        return new CoinTransactionSigner(transaction)
    }
}
