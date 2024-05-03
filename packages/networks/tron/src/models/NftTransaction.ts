import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { type NftTransactionInterface, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns {Promise<string>} Receiver wallet address
     */
    async getReceiver(): Promise<string> {
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
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
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
     * @returns {Promise<number>} NFT ID
     */
    async getNftId(): Promise<number> {
        return Number((await this.decodeData())?.decodedInput[2] ?? 0)
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
