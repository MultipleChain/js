import { hexToNumber } from '@multiplechain/utils'
import { Token } from '../assets/Token'
import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type { WalletAddress, TokenTransactionInterface, TransferAmount } from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns {Promise<WalletAddress>} Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
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
     * @returns {Promise<WalletAddress>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
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
     * @returns {Promise<TransferAmount>} Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const token = new Token(await this.getAddress())
        const decoded = await this.decodeData()
        if (decoded === null) {
            return 0
        }

        if (decoded.methodName === 'transferFrom') {
            const amount = decoded.decodedInput[2] as bigint
            return hexToNumber(amount.toString(), await token.getDecimals())
        }

        const amount = decoded.decodedInput[1] as bigint
        return hexToNumber(amount.toString(), await token.getDecimals())
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (token)
     * @param {WalletAddress} address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param {TransferAmount} amount Amount of tokens that will be approved
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
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
