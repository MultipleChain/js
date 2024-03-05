import { Transaction } from './Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetTransactionInterface, AssetDirectionEnum } from '@multiplechain/types'

export class AssetTransaction extends Transaction implements AssetTransactionInterface {
    /**
     * @returns Receiver wallet address of the transaction (asset)
     */
    getReceiver(): string {
        return 'example'
    }

    /**
     * @returns Transfer amount of the transaction (coin)
     */
    getAmount(): number {
        return 0
    }

    /**
     * @param direction - Direction of the transaction (asset)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param amount Amount of assets that will be transferred
     */
    verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): TransactionStatusEnum {
        return TransactionStatusEnum.CONFIRMED
    }
}
