import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { NftTransactionInterface, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns {Promise<string>} Receiver wallet address
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
     * @returns {Promise<number>} NFT ID
     */
    async getNftId(): Promise<number> {
        return 0
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (nft)
     * @param {string} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {number} nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        nftId: number | string
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
