import type { ParsedInstruction } from '@solana/web3.js'
import { TransactionStatusEnum } from '@multiplechain/types'
import { ContractTransaction } from './ContractTransaction.ts'
import { type NftTransactionInterface, AssetDirectionEnum } from '@multiplechain/types'

export class NftTransaction extends ContractTransaction implements NftTransactionInterface {
    /**
     * @returns {Promise<ParsedInstruction>} Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: any): ParsedInstruction {
        return data.transaction.message.instructions.find((instruction: any): boolean => {
            return (
                instruction.parsed !== undefined &&
                (instruction.parsed.type === 'transferChecked' ||
                    instruction.parsed.type === 'transfer')
            )
        }) as ParsedInstruction
    }

    /**
     * @returns {Promise<string>} Contract address of the transaction
     */
    async getAddress(): Promise<string> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        const instruction = this.findTransferInstruction(data)

        if (instruction.parsed?.info.mint !== undefined) {
            return instruction.parsed.info.mint
        }

        const postBalance = data.meta?.postTokenBalances?.find((balance: any): boolean => {
            return balance.mint !== undefined
        })

        if (postBalance !== undefined) {
            return postBalance.mint
        }

        return await super.getAddress()
    }

    /**
     * @returns {Promise<string>} Receiver wallet address
     */
    async getReceiver(): Promise<string> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        if (data.meta?.postTokenBalances?.length === undefined) {
            return ''
        }

        return data.meta.postTokenBalances[0].owner ?? ''
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
        const data = await this.getData()

        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data).parsed.info.authority
    }

    /**
     * @returns {Promise<string>} NFT ID
     */
    async getNftId(): Promise<string> {
        const data = await this.getData()

        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data).parsed.info.mint
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (nft)
     * @param {string} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {string} nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        nftId: string | number
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
