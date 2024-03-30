import { Transaction } from './Transaction.ts'
import { hexToNumber } from '@multiplechain/utils'
import { Provider } from '../services/Provider.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { AssetDirectionEnum, type CoinTransactionInterface } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns Wallet address of the sender of transaction
     */
    async getReceiver(): Promise<string> {
        const data = await this.getData()
        return data?.response.to ?? ''
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getFrom(): Promise<string> {
        return await this.getSender()
    }

    /**
     * @returns Transfer amount of the transaction (coin)
     */
    async getAmount(): Promise<number> {
        const data = await this.getData()
        const { decimals } = Provider.instance.network.nativeCurrency
        return hexToNumber((data?.response.value ?? 0).toString(), decimals)
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
            if ((await this.getFrom()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
