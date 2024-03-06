import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { CoinInterface, TransactionSignerInterface } from '@multiplechain/types'

export class Coin implements CoinInterface {
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
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    getBalance(owner: string): number {
        return 0
    }

    /**
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    transfer(sender: string, receiver: string, amount: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }
}
