import { Transaction } from './Transaction.ts'
import type { ParsedInstruction } from '@solana/web3.js'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns {Promise<ParsedInstruction>} Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: any): ParsedInstruction | null {
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
