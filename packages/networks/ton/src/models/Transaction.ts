import { Provider } from '../services/Provider'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import {
    TransactionTypeEnum,
    type BlockConfirmationCount,
    type BlockNumber,
    type BlockTimestamp,
    type TransactionFee,
    type TransactionId,
    type TransactionInterface,
    type WalletAddress
} from '@multiplechain/types'
import { Address, fromNano } from '@ton/core'
import type { Action, Transaction as TxData } from 'ton-center-v3/response'

// custom tx data for each blockchain

export interface TransactionData {
    transaction: TxData
    action: Action
}

export class Transaction implements TransactionInterface<TransactionData> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: TransactionId

    /**
     * Transaction data
     */
    data: TransactionData | null = null

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param id Transaction id
     * @param provider Blockchain network provider
     */
    constructor(id: TransactionId, provider?: Provider) {
        this.id = id
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Transaction data
     */
    async getData(): Promise<TransactionData | null> {
        try {
            if (this.data !== null) {
                return this.data
            }

            const res =
                (await this.provider.client3.getTransactions({
                    hash: this.id
                })) ?? undefined

            if (res === undefined) {
                return null
            }

            const transaction = res.transactions[0]

            if (transaction === undefined) {
                return null
            }

            const action = (
                await this.provider.client3.getActions({ trace_id: [transaction.trace_id] })
            ).actions[0]

            if (action === undefined) {
                return null
            }

            return (this.data = { transaction, action })
        } catch (error) {
            throw new Error(ErrorTypeEnum.RPC_REQUEST_ERROR)
        }
    }

    /**
     * @param ms - Milliseconds to wait for the transaction to be confirmed. Default is 4000ms
     * @returns Status of the transaction
     */
    async wait(ms: number = 4000): Promise<TransactionStatusEnum> {
        return await new Promise((resolve, reject) => {
            const check = async (): Promise<void> => {
                try {
                    const status = await this.getStatus()
                    if (status !== TransactionStatusEnum.PENDING) {
                        resolve(status)
                        return
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    console.error(error)
                    reject(TransactionStatusEnum.FAILED)
                }
            }
            void check()
        })
    }

    /**
     * @returns Transaction ID
     */
    getId(): TransactionId {
        return this.id
    }

    /**
     * @returns Type of the transaction
     */
    async getType(): Promise<TransactionTypeEnum> {
        const data = await this.getData()

        if (data === null) {
            return TransactionTypeEnum.GENERAL
        }

        const type = data.action.type

        if (type === 'ton_transfer') {
            return TransactionTypeEnum.COIN
        }

        if (type === 'jetton_transfer') {
            return TransactionTypeEnum.TOKEN
        }

        if (type === 'nft_transfer') {
            return TransactionTypeEnum.NFT
        }

        return TransactionTypeEnum.CONTRACT
    }

    /**
     * @returns Transaction URL
     */
    getUrl(): string {
        return this.provider.explorerUrl + this.id
    }

    async getComment(): Promise<string> {
        const data = await this.getData()
        return data?.action.details.comment as string
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
        const data = await this.getData()
        const source = data?.transaction.account ?? ''
        return Address.parse(source).toString(this.provider.walletStandard)
    }

    /**
     * @returns Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        const data = await this.getData()
        return Number(fromNano(data?.transaction.total_fees ?? 0))
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        return data?.transaction.block_ref.seqno ?? 0
    }

    /**
     * @returns Workchain of the transaction
     */
    async getWorkchain(): Promise<number> {
        const data = await this.getData()
        return data?.transaction.block_ref.workchain ?? 0
    }

    /**
     * @returns Shard of the transaction
     */
    async getShard(): Promise<string> {
        const data = await this.getData()
        return data?.transaction.block_ref.shard ?? ''
    }

    /**
     * @returns Block reference of the transaction
     */
    async getBlockId(): Promise<string> {
        const data = await this.getData()
        const ref = data?.transaction.block_ref
        return `${ref?.workchain}:${ref?.shard}:${ref?.seqno}`
    }

    /**
     * @returns Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const data = await this.getData()
        return data?.transaction.now ?? 0
    }

    /**
     * @returns Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const blockNumber = await this.getBlockNumber()
        const { blocks } = await this.provider.client3.getBlocks({
            workchain: this.provider.workchain,
            sort: 'desc'
        })
        return blocks[0].seqno - blockNumber
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data?.transaction.prev_trans_hash) {
            return data.action.success
                ? TransactionStatusEnum.CONFIRMED
                : TransactionStatusEnum.FAILED
        }
        return TransactionStatusEnum.PENDING
    }
}
