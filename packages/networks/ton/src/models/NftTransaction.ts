import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import {
    type NftTransactionInterface,
    AssetDirectionEnum,
    type WalletAddress,
    type NftId,
    type ContractAddress
} from '@multiplechain/types'
import { Address } from '@ton/core'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        const address = (data?.action.details.nft_collection ?? '') as string
        return Address.parse(address).toString(this.provider.contractStandard)
    }

    /**
     * @returns Receiver wallet address
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = (data?.action.details.new_owner ?? '') as string
        return Address.parse(source).toString(this.provider.walletStandard)
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = (data?.action.details.old_owner ?? '') as string
        return Address.parse(source).toString(this.provider.walletStandard)
    }

    /**
     * @returns NFT ID
     */
    async getNftId(): Promise<NftId> {
        const data = await this.getData()
        const address = (data?.action.details.nft_item ?? '') as string
        return Address.parse(address).toString(this.provider.contractStandard)
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
        const status = await this.getStatus()

        if (status === TransactionStatusEnum.PENDING) {
            return TransactionStatusEnum.PENDING
        }

        if ((await this.getNftId()) !== nftId) {
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
