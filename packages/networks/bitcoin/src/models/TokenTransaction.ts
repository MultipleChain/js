import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, TokenTransactionInterface } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns {Promise<string>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<string> {
        return 'example'
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
        return 'example'
    }

    /**
     * @returns {Promise<number>} Amount of tokens that will be transferred
     */
    async getAmount(): Promise<number> {
        return 0
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (token)
     * @param {string} address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param {number} amount Amount of tokens that will be approved
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
