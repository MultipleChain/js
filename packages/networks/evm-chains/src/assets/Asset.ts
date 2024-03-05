import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { AssetInterface, TransactionSignerInterface } from '@multiplechain/types'

export class Asset implements AssetInterface {
    /**
     * @returns Asset name
     */
    getName(): string {
        return 'example'
    }

    /**
     * @returns Asset symbol
     */
    getSymbol(): string {
        return 'example'
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    getBalance(owner: string): number {
        return 0
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    transfer(sender: string, receiver: string, amount: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }
}
