import { Provider } from '../services/Provider'
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
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import { NFT } from '../assets/NFT'

interface RetObject {
    contractRet: string
}

interface ContractObject {
    parameter: {
        value: {
            data?: string
            owner_address: string
            contract_address?: string
            to_address?: string
            amount?: number
        }
        type_url: string
    }
    type: string
}

interface LogObject {
    address: string
    topics: string[]
    data: string
}

export interface TransactionData {
    ret: RetObject[]
    signature: string[]
    txID: string
    raw_data: {
        contract: ContractObject[]
        ref_block_bytes: string
        ref_block_hash: string
        expiration: number
        timestamp: number
        fee_limit?: number
    }
    raw_data_hex: string
    info?: {
        id: string
        fee: number
        packingFee: number
        blockNumber: number
        blockTimeStamp: number
        contractResult: string[]
        contract_address?: string
        receipt: {
            result?: string
            net_fee: number
            net_usage?: number
            energy_fee?: number
            energy_usage?: number
            energy_usage_total?: number
            energy_penalty_total?: number
        }
        result?: string
        resMessage?: string
        log?: LogObject[]
    }
}

const selectors = {
    // TRC20
    [TransactionTypeEnum.TOKEN]: [
        'a9059cbb', // transfer(address,uint256)
        '095ea7b3', // approve(address,uint256)
        '23b872dd' // transferFrom(address,address,uint256)
    ],
    // TRC721, TRC1155
    [TransactionTypeEnum.NFT]: [
        // TRC721
        '23b872dd', // transferFrom(address,address,uint256)
        '095ea7b3', // approve(address,uint256)
        '42842e0e', // safeTransferFrom(address,address,uint256)
        'b88d4fde', // safeTransferFrom(address,address,uint256,bytes)
        // TRC1155
        'f242432a', // safeTransferFrom(address,address,uint256,uint256,bytes)
        '2eb2c2d6', // safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)
        '29535c7e' // setApprovalForAll(address,bool)
    ]
}

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
     * Transaction data after completed
     */
    data: TransactionData

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
            if (this.data?.info !== undefined) {
                return this.data
            }
            this.data = (await this.provider.tronWeb.trx.getTransaction(this.id)) ?? undefined
            if (this.data === undefined) {
                return null
            }
            const result = await this.provider.tronWeb.trx.getTransactionInfo(this.id)
            this.data.info = result?.id !== undefined ? result : undefined
            return this.data
        } catch (error) {
            console.error('MC Tron TX getData', error)
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
                    if (status === TransactionStatusEnum.CONFIRMED) {
                        resolve(TransactionStatusEnum.CONFIRMED)
                        return
                    } else if (status === TransactionStatusEnum.FAILED) {
                        reject(TransactionStatusEnum.FAILED)
                        return
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    console.error('MC Tron TX wait', error)
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

        if (data.raw_data.contract[0].type === 'TriggerSmartContract') {
            const val = data.raw_data.contract[0].parameter.value
            const type = Object.entries(selectors).find(([_key, values]) => {
                return values.includes(val.data?.slice(0, 8) ?? '')
            })
            if (type !== undefined) {
                const tryNft = new NFT(val.contract_address ?? '')
                try {
                    await tryNft.getApproved(1)
                    return TransactionTypeEnum.NFT
                } catch {
                    return TransactionTypeEnum.TOKEN
                }
            }
            return TransactionTypeEnum.CONTRACT
        } else if (data.raw_data.contract[0].type === 'TransferContract') {
            return TransactionTypeEnum.COIN
        }

        return TransactionTypeEnum.GENERAL
    }

    /**
     * @returns Transaction URL
     */
    getUrl(): string {
        let explorerUrl = this.provider.node.explorer
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/'
        explorerUrl += '#/transaction/' + this.id
        return explorerUrl
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
        const data = await this.getData()
        return this.provider.tronWeb.address.fromHex(
            data?.raw_data.contract[0].parameter.value.owner_address ?? ''
        )
    }

    /**
     * @returns Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        const data = await this.getData()
        return parseFloat(this.provider.tronWeb.fromSun(data?.info?.fee ?? 0) as unknown as string)
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        return data?.info?.blockNumber ?? 0
    }

    /**
     * @returns Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const data = await this.getData()
        return parseInt((data?.info?.blockTimeStamp ?? 0).toString().replace(/0+$/, ''))
    }

    /**
     * @returns Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const data = await this.getData()
        const blockNumber = data?.info?.blockNumber ?? 0
        const latestBlock = await this.provider.tronWeb.trx.getCurrentBlock()
        return latestBlock.block_header.raw_data.number - blockNumber
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data === null) {
            return TransactionStatusEnum.PENDING
        } else if (data?.ret.length > 0 && data.info !== undefined) {
            if (this.data.info?.blockNumber !== undefined) {
                if (this.data.ret[0].contractRet === 'REVERT') {
                    return TransactionStatusEnum.FAILED
                } else if (this.data.info.result === 'FAILED') {
                    return TransactionStatusEnum.FAILED
                } else {
                    return TransactionStatusEnum.CONFIRMED
                }
            }
        }
        return TransactionStatusEnum.PENDING
    }
}
