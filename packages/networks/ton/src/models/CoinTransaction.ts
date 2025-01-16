import { Transaction } from './Transaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import {
    AssetDirectionEnum,
    type CoinTransactionInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { Address, fromNano } from '@ton/core'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = (data?.action.details.destination ?? '') as string
        return Address.parse(source).toString(this.provider.walletStandard)
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = (data?.action.details.source ?? '') as string
        return Address.parse(source).toString(this.provider.walletStandard)
    }

    /**
     * @returns Amount of coin that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const data = await this.getData()
        return Number(fromNano(data?.action.details.value as string))
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
        const status = await this.getStatus()

        if (status === TransactionStatusEnum.PENDING) {
            return TransactionStatusEnum.PENDING
        }

        if ((await this.getAmount()) !== amount) {
            return TransactionStatusEnum.FAILED
        }

        if (direction === AssetDirectionEnum.INCOMING) {
            if ((await this.getReceiver()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        } else {
            if ((await this.getSender()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
