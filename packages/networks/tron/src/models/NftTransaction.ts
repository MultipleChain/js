import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type { NftId, NftTransactionInterface, WalletAddress } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns Receiver wallet address
     */
    async getReceiver(): Promise<WalletAddress> {
        const decoded = await this.decodeData()

        if (decoded === null) {
            return ''
        }

        if (decoded.methodName === 'transferFrom') {
            return this.provider.tronWeb.address.fromHex(decoded.decodedInput[1])
        }

        return this.provider.tronWeb.address.fromHex(decoded.decodedInput[0])
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const decoded = await this.decodeData()

        if (decoded === null) {
            return ''
        }

        if (decoded.methodName === 'transferFrom') {
            return this.provider.tronWeb.address.fromHex(decoded.decodedInput[0])
        }

        return await this.getSigner()
    }

    /**
     * @returns NFT ID
     */
    async getNftId(): Promise<NftId> {
        return Number((await this.decodeData())?.decodedInput[2] ?? 0)
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
