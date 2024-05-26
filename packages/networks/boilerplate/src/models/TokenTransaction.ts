import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, TokenTransactionInterface, TransferAmount, WalletAddress } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns {Promise<WalletAddress>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @returns {Promise<WalletAddress>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @returns {Promise<TransferAmount>} Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        return 0
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (token)
     * @param {WalletAddress} address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param {TransferAmount} amount Amount of tokens that will be approved
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
