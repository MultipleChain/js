import { fromMist, math } from '../utils'
import { Provider } from '../services/Provider'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import type {
    SuiTransactionBlockResponse,
    SuiTransactionBlockKind,
    SuiCallArg
} from '@mysten/sui/client'
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

type SuiCallArgTypes = SuiCallArg extends { type: infer K } ? K : never
type TransactionKinds = SuiTransactionBlockKind extends { kind: infer K } ? K : never
type SuiTransactionBlockKindMap = {
    [K in SuiTransactionBlockKind as K['kind']]: K
}
type SuiCallArgMap = {
    [K in SuiCallArg as K['type']]: K
}

// custom tx data for each blockchain
type TxData = SuiTransactionBlockResponse

export class Transaction implements TransactionInterface<TxData> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: TransactionId

    /**
     * Transaction data
     */
    data: TxData | null = null

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
    async getData(): Promise<TxData | null> {
        if (this.data) {
            return this.data
        }
        try {
            const response = await this.provider.client.getTransactionBlock({
                digest: this.id,
                options: {
                    showInput: true,
                    showEffects: true,
                    showEvents: true,
                    showRawInput: true,
                    showBalanceChanges: true,
                    showObjectChanges: true
                }
            })
            if (response.transaction === null) {
                return null
            }
            return (this.data = response)
        } catch (error) {
            console.error('MC SUI TX getData', error)
            if (error instanceof Error && String(error.message).includes('timeout')) {
                throw new Error(ErrorTypeEnum.RPC_TIMEOUT)
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
                    await this.provider.client.waitForTransaction({ digest: this.id })
                    const status = await this.getStatus()
                    if (status !== TransactionStatusEnum.PENDING) {
                        resolve(status)
                        return
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    console.error('MC SUI TX wait', error)
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

        switch (data.objectChanges?.length) {
            case 2:
                return data.balanceChanges?.length === 1
                    ? TransactionTypeEnum.NFT
                    : TransactionTypeEnum.COIN
            case 3:
                return TransactionTypeEnum.TOKEN
            default:
                return TransactionTypeEnum.CONTRACT
        }
    }

    /**
     * @returns Transaction URL
     */
    getUrl(): string {
        let explorerUrl = this.provider.node.explorerUrl
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/'
        explorerUrl += 'tx/' + this.id
        return explorerUrl
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
        return (await this.getData())?.transaction?.data.sender ?? ''
    }

    /**
     * @returns Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }
        const storageCost = fromMist(data.effects?.gasUsed.storageCost ?? 0)
        const storageRebate = fromMist(data.effects?.gasUsed.storageRebate ?? 0)
        const computationCost = fromMist(data.effects?.gasUsed.computationCost ?? 0)
        return math.sub(math.add(storageCost, computationCost, 9), storageRebate, 9)
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }
        return Number(data.checkpoint)
    }

    /**
     * @returns Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const data = await this.getData()
        if (data === null) {
            return 0
        }
        return Number(data.timestampMs)
    }

    /**
     * @returns Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const blockNumber = await this.getBlockNumber()
        const blockCount =
            (await this.provider.client.getLatestCheckpointSequenceNumber()) as any as number
        const confirmations = blockCount - blockNumber
        return confirmations < 0 ? 0 : confirmations
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data?.effects?.status.status === 'success') {
            return TransactionStatusEnum.CONFIRMED
        } else if (data?.effects?.status.status === 'failure') {
            return TransactionStatusEnum.FAILED
        } else {
            return TransactionStatusEnum.PENDING
        }
    }

    protected async getTransaction<T extends TransactionKinds>(
        _kid: T
    ): Promise<SuiTransactionBlockKindMap[T] | undefined> {
        const tx = (await this.getData())?.transaction?.data?.transaction
        if (tx) {
            return tx as SuiTransactionBlockKindMap[T]
        }
        return undefined
    }

    protected async getInputs<T extends SuiCallArgTypes>(
        _type: T,
        vType?: string | null
    ): Promise<Array<SuiCallArgMap[T]> | undefined> {
        const tx = await this.getTransaction('ProgrammableTransaction')
        if (tx) {
            return tx.inputs.filter((input) => {
                if (vType && input.type === 'pure') {
                    return input.valueType === vType
                }
                return input.type === _type
            }) as Array<SuiCallArgMap[T]>
        }
        return undefined
    }
}
