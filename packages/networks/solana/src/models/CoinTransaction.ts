import { fromLamports } from '../utils'
import { Transaction } from './Transaction'
import type { ParsedInstruction, ParsedTransactionWithMeta } from '@solana/web3.js'
import {
    AssetDirectionEnum,
    TransactionStatusEnum,
    type WalletAddress,
    type CoinTransactionInterface,
    type TransferAmount
} from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * @param data Transaction data
     * @returns Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: ParsedTransactionWithMeta): ParsedInstruction | null {
        return (
            (data.transaction.message.instructions.find((instruction: any): boolean => {
                return (
                    instruction.parsed !== undefined &&
                    (instruction.parsed.type === 'transfer' ||
                        instruction.parsed.type === 'createAccount')
                )
            }) as ParsedInstruction) ?? null
        )
    }

    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        const instruction = this.findTransferInstruction(data)

        return instruction?.parsed.info.destination ?? instruction?.parsed.info.newAccount ?? ''
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data)?.parsed.info.source ?? ''
    }

    /**
     * @returns Amount of coin that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }

        return fromLamports(
            (this.findTransferInstruction(data)?.parsed.info.lamports as number) ?? 0
        )
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
