import type { ParsedInstruction } from '@solana/web3.js'
import { TransactionStatusEnum } from '@multiplechain/types'
import { ContractTransaction } from './ContractTransaction.ts'
import { AssetDirectionEnum, type TokenTransactionInterface } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
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
     * @returns {Promise<string>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<string> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        if (data.meta?.postTokenBalances?.length === undefined) {
            return ''
        }

        return data.meta.postTokenBalances[1].owner ?? ''
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<string> {
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
     * @returns {Promise<number>} Amount of tokens that will be transferred
     */
    async getAmount(): Promise<number> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }

        return this.findTransferInstruction(data).parsed.info.tokenAmount.uiAmount as number
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (token)
     * @param {string} address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param {number} amount Amount of tokens that will be approved
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): Promise<TransactionStatusEnum> {
        const status = await this.getStatus()

        if (status === TransactionStatusEnum.PENDING) {
            return TransactionStatusEnum.PENDING
        }

        if ((await this.getAmount()) !== amount) {
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
