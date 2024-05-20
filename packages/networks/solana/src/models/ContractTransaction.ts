import { Transaction } from './Transaction.ts'
import type { ParsedInstruction } from '@solana/web3.js'
import type { ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns {Promise<ParsedInstruction>} Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: any): ParsedInstruction {
        const length = data.transaction.message.instructions.length
        return data.transaction.message.instructions[length - 1] as ParsedInstruction
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

        if (instruction.parsed?.info?.mint !== undefined) {
            return instruction.parsed.info.mint
        }

        return instruction.programId.toBase58()
    }
}
