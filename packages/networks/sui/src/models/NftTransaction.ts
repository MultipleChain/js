import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import type {
    NftTransactionInterface,
    AssetDirectionEnum,
    WalletAddress,
    NftId
} from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns Receiver wallet address
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
     * @returns NFT ID
     */
    async getNftId(): Promise<NftId> {
        return 0
    }

    /**
     * @param direction - Direction of the transaction (nft)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param nftId ID of the NFT that will be transferred
     * @returns Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: WalletAddress,
        nftId: NftId
    ): Promise<TransactionStatusEnum> {
        return TransactionStatusEnum.PENDING
    }
}
