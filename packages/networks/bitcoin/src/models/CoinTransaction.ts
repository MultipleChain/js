import { fromSatoshi } from '../utils.ts'
import { Transaction } from './Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { AssetDirectionEnum, type CoinTransactionInterface } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns {Promise<string>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<string> {
        const data = await this.getData()
        return data?.vout[0].scriptpubkey_address ?? ''
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
        return fromSatoshi(data?.vout[0].value ?? 0)
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
