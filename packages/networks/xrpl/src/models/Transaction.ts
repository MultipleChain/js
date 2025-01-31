import { sleep } from '@multiplechain/utils'
import { Provider } from '../services/Provider'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import { dropsToXrp, type Transaction as BaseTransactionData, type TransactionMetadata } from 'xrpl'
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

export type TransactionData = BaseTransactionData & {
    meta?: TransactionMetadata
    Destination?: string
    ledger_index?: number
    Amount?: number
    date?: number
}

let counter = 0

export class Transaction implements TransactionInterface<TransactionData> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: TransactionId

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * Transaction data
     */
    data: TransactionData | null = null

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
        if (this.data?.meta) {
            return this.data
        }
        try {
            return (this.data = await this.provider.rpc.getTransaction(this.id))
        } catch (error) {
            console.error('MC XRPl TX getData', error)
            // Returns empty data when the transaction is first created. For this reason, it would be better to check it intermittently and give an error if it still does not exist. Average 10 seconds.
            if (String((error as any).message).includes('Transaction not found')) {
                if (counter > 5) {
                    throw new Error(ErrorTypeEnum.TRANSACTION_NOT_FOUND)
                }
                counter++
                await sleep(2000)
                return await this.getData()
            }
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
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    console.error('MC XRPl TX wait', error)
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
     * @returns Transaction type
     */
    async getType(): Promise<TransactionTypeEnum> {
        return TransactionTypeEnum.COIN
    }

    /**
     * @returns Transaction URL
     */
    getUrl(): string {
        return this.provider.explorer + 'transactions/' + this.id
    }

    async getMemos(): Promise<object[]> {
        const data = await this.getData()
        return (data?.Memos ?? []).map(({ Memo }) => {
            if (Memo.MemoData) {
                Memo.MemoData = Buffer.from(Memo.MemoData, 'hex').toString('utf-8')
            }

            if (Memo.MemoType) {
                Memo.MemoType = Buffer.from(Memo.MemoType, 'hex').toString('utf-8')
            }

            if (Memo.MemoFormat) {
                Memo.MemoFormat = Buffer.from(Memo.MemoFormat, 'hex').toString('utf-8')
            }

            return Memo
        })
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
        const data = await this.getData()
        return data?.Account ?? ''
    }

    /**
     * @returns Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        const data = await this.getData()
        return dropsToXrp(data?.Fee ?? 0)
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        return data?.ledger_index ?? 0
    }

    /**
     * @returns Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const data = await this.getData()
        return data?.date ?? 0
    }

    /**
     * @returns Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const blockNumber = await this.getBlockNumber()
        const ledger = await this.provider.rpc.getLedger()
        return ledger.result.ledger_index - blockNumber
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data?.meta) {
            return data?.meta?.TransactionResult === 'tesSUCCESS'
                ? TransactionStatusEnum.CONFIRMED
                : TransactionStatusEnum.FAILED
        }
        return TransactionStatusEnum.PENDING
    }
}
