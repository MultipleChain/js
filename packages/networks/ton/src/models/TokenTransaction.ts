import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum } from '@multiplechain/types'
import {
    AssetDirectionEnum,
    type ContractAddress,
    type TokenTransactionInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { math } from '@multiplechain/utils'
import { Address } from '@ton/core'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        const address = (data?.action.details.asset ?? '') as string
        return Address.parse(address).toString(this.provider.contractStandard)
    }

    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = (data?.action.details.receiver ?? '') as string
        return Address.parse(source).toString(this.provider.walletStandard)
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const data = await this.getData()
        const destination = (data?.action.details.sender ?? '') as string
        return Address.parse(destination).toString(this.provider.walletStandard)
    }

    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiverJettonWallet(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = (data?.action.details.receiver_jetton_wallet ?? '') as string
        return Address.parse(source).toString(this.provider.contractStandard)
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSenderJettonWallet(): Promise<WalletAddress> {
        const data = await this.getData()
        const destination = (data?.action.details.sender_jetton_wallet ?? '') as string
        return Address.parse(destination).toString(this.provider.contractStandard)
    }

    /**
     * @returns Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const data = await this.getData()
        const amount = Number(data?.action.details.amount ?? 0)
        const tokenData = await this.provider.client3.getJettonMasters({
            address: [await this.getAddress()]
        })
        const decimals = Number(tokenData.jetton_masters[0].jetton_content.decimals)
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
