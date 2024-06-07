import { Transaction } from './Transaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, CoinTransactionInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @returns Amount of coin that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        return 0
    }

    /**
     * @param direction - Direction of the transaction (asset)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param amount Amount of assets that will be transferred
     * @returns Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
