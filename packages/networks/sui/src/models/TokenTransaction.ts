import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import {
    AssetDirectionEnum,
    type TokenTransactionInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { math } from '../utils'
import { Token } from '../assets'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }
        const ixs = await this.getInputs('pure', 'address')
        return (ixs?.[0].value ?? '') as string
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        return await this.getSigner()
    }

    /**
     * @returns Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const address = await this.getAddress()
        const ixs = await this.getInputs('pure', 'u64')
        const amount = (ixs?.[0].value as number) ?? 0
        const decimals = await new Token(address).getDecimals()
        return math.div(amount, math.pow(10, decimals), decimals)
    }

    /**
     * @param direction - Direction of the transaction (token)
     * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param amount Amount of tokens that will be approved
     * @returns Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: WalletAddress,
        amount: TransferAmount
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
