import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, TokenTransactionInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
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
     * @returns Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        return 0
    }

    /**
     * @param direction - Direction of the transaction (token)
     * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param amount Amount of tokens that will be approved
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
