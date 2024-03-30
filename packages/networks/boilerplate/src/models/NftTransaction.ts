import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { NftTransactionInterface, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction
    extends ContractTransaction
    implements Omit<NftTransactionInterface, 'getAmount'>
{
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
     * @returns ID of the NFT
     */
    async getNftId(): Promise<number> {
        return 0
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
        return TransactionStatusEnum.PENDING
    }
}
