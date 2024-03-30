import { Token } from '../assets/Token.ts'
import ERC20 from '../../resources/erc20.json'
import { hexToNumber } from '@multiplechain/utils'
import { ContractTransaction } from './ContractTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { AssetDirectionEnum, type TokenTransactionInterface } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns Wallet address of the sender of transaction
     */
    async getReceiver(): Promise<string> {
        const decoded = await this.decodeData(ERC20)
        console.log(decoded)
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
    async getFrom(): Promise<string> {
        const decoded = await this.decodeData(ERC20)
        if (decoded === null) {
            return ''
        }

        if (decoded.name === 'transferFrom') {
            return decoded.args[0]
        }

        return await this.getSender()
    }

    /**
     * @returns Wallet address of the sender of transaction
     */

    /**
     * @returns Transfer amount of the transaction (token)
     */
    async getAmount(): Promise<number> {
        const token = new Token(await this.getAddress())
        const decoded = await this.decodeData(ERC20)
        if (decoded === null) {
            return 0
        }

        if (decoded.name === 'transferFrom') {
            return hexToNumber((decoded.args[2] as bigint).toString(), await token.getDecimals())
        }

        return hexToNumber((decoded.args[1] as bigint).toString(), await token.getDecimals())
    }

    /**
     * @param direction - Direction of the transaction (token)
     * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param amount Amount of tokens that will be approved
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
            if ((await this.getFrom()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
