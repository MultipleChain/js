import { PublicKey } from '@solana/web3.js'
import { math } from '@multiplechain/utils'
import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type {
    ParsedAccountData,
    ParsedInstruction,
    ParsedTransactionWithMeta
} from '@solana/web3.js'
import type {
    ContractAddress,
    TokenTransactionInterface,
    TransferAmount,
    WalletAddress
} from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @param data Transaction data
     * @returns Wallet address of the receiver of transaction
     */
    findTransferInstruction(data: ParsedTransactionWithMeta): ParsedInstruction | null {
        return (
            (data.transaction.message.instructions.find((instruction: any): boolean => {
                return (
                    instruction.parsed !== undefined &&
                    (instruction.parsed.type === 'transferChecked' ||
                        instruction.parsed.type === 'transfer')
                )
            }) as ParsedInstruction) ?? null
        )
    }

    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        const instruction = this.findTransferInstruction(data)

        if (instruction?.parsed?.info.mint !== undefined) {
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
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        const instruction = this.findTransferInstruction(data)
        const accountInfo = await this.provider.web3.getParsedAccountInfo(
            new PublicKey(instruction?.parsed.info.destination as string)
        )

        return (accountInfo.value?.data as ParsedAccountData)?.parsed?.info?.owner ?? ''
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const data = await this.getData()
        if (data === null) {
            return ''
        }

        return this.findTransferInstruction(data)?.parsed.info.authority
    }

    /**
     * @returns Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }

        const instruction = this.findTransferInstruction(data)

        if (instruction?.parsed?.info?.tokenAmount?.uiAmount !== undefined) {
            return instruction.parsed.info.tokenAmount.uiAmount as number
        }

        const amount = instruction?.parsed.info.amount as number

        const postBalance = data.meta?.postTokenBalances?.find((balance: any): boolean => {
            return balance.mint !== undefined
        })

        const decimals = postBalance?.uiTokenAmount?.decimals ?? 0

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
