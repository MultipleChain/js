import { fromLamports } from '../utils.ts'
import { Transaction } from './Transaction.ts'
import type { ParsedInstruction } from '@solana/web3.js'
import { TransactionStatusEnum } from '@multiplechain/types'
import { AssetDirectionEnum, type CoinTransactionInterface } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @returns {Promise<ParsedInstruction>} Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: any): ParsedInstruction {
        return data.transaction.message.instructions.find((instruction: any): boolean => {
            return instruction.parsed !== undefined && instruction.parsed.type === 'transfer'
        }) as ParsedInstruction
    }

    /**
     * @returns {Promise<string>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<string> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data).parsed.info.destination
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data).parsed.info.source
    }

    /**
     * @returns {Promise<number>} Amount of coin that will be transferred
     */
    async getAmount(): Promise<number> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }

        return fromLamports(this.findTransferInstruction(data).parsed.info.lamports as number)
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
