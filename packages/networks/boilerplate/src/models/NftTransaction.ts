import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { NftTransactionInterface, AssetDirectionEnum, WalletAddress, NftId } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns {Promise<WalletAddress>} Receiver wallet address
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
     * @returns {Promise<NftId>} NFT ID
     */
    async getNftId(): Promise<NftId> {
        return 0
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (nft)
     * @param {WalletAddress} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: WalletAddress,
        nftId: NftId
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
