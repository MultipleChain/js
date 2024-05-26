import { Transaction } from './Transaction'
import type { ParsedInstruction, ParsedTransactionWithMeta } from '@solana/web3.js'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @param {ParsedTransactionWithMeta} data Transaction data
     * @returns {Promise<ParsedInstruction>} Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: ParsedTransactionWithMeta): ParsedInstruction | null {
        const length = data.transaction.message.instructions.length
        return data.transaction.message.instructions[length - 1] as ParsedInstruction
    }

    /**
     * @returns {Promise<ContractAddress>} Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data)?.programId.toBase58() ?? ''
    }
}
