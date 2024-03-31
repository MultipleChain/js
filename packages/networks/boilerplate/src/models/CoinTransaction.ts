import { Transaction } from './Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, CoinTransactionInterface } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns Wallet address of the sender of transaction
     */
    async getReceiver(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Transfer amount of the transaction (coin)
     */
    async getAmount(): Promise<number> {
        return 0
    }

    /**
     * @param direction - Direction of the transaction (asset)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param amount Amount of assets that will be transferred
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
