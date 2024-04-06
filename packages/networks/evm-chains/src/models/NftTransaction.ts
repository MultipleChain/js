import type { InterfaceAbi } from 'ethers'
import ERC721 from '../../resources/erc721.json'
import type { Provider } from '../services/Provider.ts'
import { ContractTransaction } from './ContractTransaction.ts'
import type { NftTransactionInterface } from '@multiplechain/types'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @param {string} id Transaction id
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(id: string, provider?: Provider, ABI?: InterfaceAbi) {
        super(id, provider, ABI ?? (ERC721 as InterfaceAbi))
    }

    /**
     * @returns {Promise<string>} Receiver wallet address
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
     * @returns {Promise<string>} Sender wallet address
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
     * @returns {Promise<number | string>} NFT ID
     */
    async getNftId(): Promise<number | string> {
        return Number((await this.decodeData())?.args[2] ?? 0)
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (nft)
     * @param {string} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {number | string} nftId ID of the NFT that will be transferred
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
