import ERC721 from '../../resources/erc721.json'
import { ContractTransaction } from './ContractTransaction.ts'
import type { NftTransactionInterface } from '@multiplechain/types'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type { TransactionDescription, TransactionResponse, InterfaceAbi } from 'ethers'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @param {string} hash
     * @param {InterfaceAbi} ABI
     */
    constructor(hash: string, ABI?: InterfaceAbi) {
        super(hash, ABI ?? ERC721)
    }

    /**
     * @param {TransactionResponse} response
     * @returns {Promise<TransactionDescription | null>}
     */
    async decodeData(response?: TransactionResponse): Promise<TransactionDescription | null> {
        return await super.decodeData(response)
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getReceiver(): Promise<string> {
        const decoded = await this.decodeData()

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
    async getSender(): Promise<string> {
        const decoded = await this.decodeData()

        if (decoded === null) {
            return ''
        }

        if (decoded.name === 'transferFrom') {
            return decoded.args[0]
        }

        return await this.getSigner()
    }

    /**
     * @returns ID of the NFT
     */
    async getNftId(): Promise<number> {
        return Number((await this.decodeData())?.args[2] ?? 0)
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
            if ((await this.getSender()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
