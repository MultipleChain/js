import ERC721 from '../../resources/erc721.json'
import { ContractTransaction } from './ContractTransaction.ts'
import type { NftTransactionInterface } from '@multiplechain/types'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns Wallet address of the sender of transaction
     */
    async getReceiver(): Promise<string> {
        const decoded = await this.decodeData(ERC721)

        if (decoded === null) {
            return ''
        }

        if (decoded.name === 'transferFrom') {
            return decoded.args[1]
        }

        return decoded.args[0]
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getFrom(): Promise<string> {
        const decoded = await this.decodeData(ERC721)

        if (decoded === null) {
            return ''
        }

        if (decoded.name === 'transferFrom') {
            return decoded.args[0]
        }

        return await this.getSender()
    }

    /**
     * @returns ID of the NFT
     */
    async getNftId(): Promise<number> {
        return Number((await this.decodeData(ERC721))?.args[2] ?? 0)
    }

    /**
     * @param direction - Direction of the transaction (nft)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        nftId: number
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
            if ((await this.getFrom()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
