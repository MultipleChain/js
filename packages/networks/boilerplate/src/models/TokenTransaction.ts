import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, TokenTransactionInterface } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns Wallet address of the sender of transaction
     */
    async getReceiver(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Transfer amount of the transaction (token)
     */
    async getAmount(): Promise<number> {
        return 0
    }

    /**
     * @param direction - Direction of the transaction (token)
     * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param amount Amount of tokens that will be approved
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }

    /**
     * @param direction - Direction of the transaction (token)
     * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param amount Amount of tokens that will be approved
     */
    async verifyApprove(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
