import { Transaction } from './Transaction.ts'
import { hexToNumber } from '@multiplechain/utils'
import { TransactionStatusEnum } from '@multiplechain/types'
import { AssetDirectionEnum, type CoinTransactionInterface } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns {Promise<string>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<string> {
        const data = await this.getData()
        return data?.response.to ?? ''
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
        return await this.getSigner()
    }

    /**
     * @returns {Promise<number>} Amount of coin that will be transferred
     */
    async getAmount(): Promise<number> {
        const data = await this.getData()
        const { decimals } = this.provider.network.nativeCurrency
        return hexToNumber((data?.response.value ?? 0).toString(), decimals)
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (asset)
     * @param {string} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
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
            if ((await this.getSender()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
