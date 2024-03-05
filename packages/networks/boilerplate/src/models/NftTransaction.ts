import { AssetTransaction } from './AssetTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { NftTransactionInterface, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction extends AssetTransaction implements NftTransactionInterface {
    /**
     * @returns ID of the NFT
     */
    getNftId(): number {
        return 0
    }

    /**
     * @returns Smart contract address of the transaction
     */
    getAddress(): string {
        return 'example'
    }

    /**
     * @param direction - Direction of the transaction (nft)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     */
    verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        nftId: number
    ): TransactionStatusEnum {
        return TransactionStatusEnum.PENDING
    }
}
