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
import type { TransactionReceipt, TransactionResponse } from 'ethers'
import type { Ethers } from '../services/Ethers'
import { hexToNumber } from '@multiplechain/utils'
import { NFT } from '../assets/NFT'

const selectors = {
    // ERC20
    [TransactionTypeEnum.TOKEN]: [
        '0xa9059cbb', // transfer(address,uint256)
        '0x095ea7b3', // approve(address,uint256)
        '0x23b872dd' // transferFrom(address,address,uint256)
    ],
    // ERC721, ERC1155
    [TransactionTypeEnum.NFT]: [
        // ERC721
        '0x23b872dd', // transferFrom(address,address,uint256)
        '0x095ea7b3', // approve(address,uint256)
        '0x42842e0e', // safeTransferFrom(address,address,uint256)
        '0xb88d4fde', // safeTransferFrom(address,address,uint256,bytes)
        // ERC1155
        '0xf242432a', // safeTransferFrom(address,address,uint256,uint256,bytes)
        '0x2eb2c2d6', // safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)
        '0x29535c7e' // setApprovalForAll(address,bool)
    ]
}

interface TransactionData {
    response: TransactionResponse
    receipt: TransactionReceipt | null
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
     * Ethers service
     */
    ethers: Ethers

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
        this.ethers = this.provider.ethers
    }

    /**
     * @returns Transaction data
     */
    async getData(): Promise<TransactionData | null> {
        if (this.data?.response !== undefined && this.data?.receipt !== null) {
            return this.data
        }
        try {
            const response = await this.ethers.getTransaction(this.id)
            if (response === null) {
                return null
            }
            const receipt = await this.ethers.getTransactionReceipt(this.id)
            return (this.data = { response, receipt })
        } catch (error) {
            console.error('MC EVM TX getData', error)
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
                    await this.provider.ethers.jsonRpc.waitForTransaction(this.id, 1)
                    const status = await this.getStatus()
                    if (status !== TransactionStatusEnum.PENDING) {
                        resolve(status)
                        return
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    console.error('MC EVM TX wait', error)
                    reject(TransactionStatusEnum.FAILED)
                }
            }
            void check()
        })
    }

    /**
     * @returns Transaction id from the blockchain network
     */
    getId(): TransactionId {
        return this.id
    }

    /**
     * @returns Type of the transaction
     */
    async getType(): Promise<TransactionTypeEnum> {
        const txData = await this.getData()

        if (txData === null) {
            return TransactionTypeEnum.GENERAL
        }

        const contractBytecode = await this.provider.ethers.getByteCode(txData.response.to ?? '')

        if (contractBytecode === '0x' || txData.response.data === '0x') {
            return TransactionTypeEnum.COIN
        }

        const type = Object.entries(selectors).find(([_key, values]) => {
            return values.includes(txData.response.data.slice(0, 10))
        })

        if (type !== undefined) {
            const tryNft = new NFT(txData.response.to ?? '')
            try {
                await tryNft.getApproved(1)
                return TransactionTypeEnum.NFT
            } catch {
                return TransactionTypeEnum.TOKEN
            }
        }

        return TransactionTypeEnum.CONTRACT
    }

    /**
     * @returns URL of the transaction on the blockchain explorer
     */
    getUrl(): string {
        let explorerUrl = this.provider.network.explorerUrl
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/'
        explorerUrl += 'tx/' + this.id
        return explorerUrl
    }

    /**
     * @returns Signer wallet address of the transaction
     */
    async getSigner(): Promise<WalletAddress> {
        const data = await this.getData()
        return data?.response.from ?? ''
    }

    /**
     * @returns Fee of the transaction
     */
    async getFee(): Promise<TransactionFee> {
        const data = await this.getData()
        if (data?.response?.gasPrice === undefined || data?.receipt?.gasUsed === undefined) {
            return 0
        }
        return hexToNumber(
            (data?.response.gasPrice * data?.receipt.gasUsed).toString(),
            this.provider.network.nativeCurrency.decimals
        )
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        return data?.response.blockNumber ?? 0
    }

    /**
     * @returns Timestamp of the block that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const blockNumber = await this.getBlockNumber()
        const block = await this.ethers.getBlock(blockNumber)
        return block?.timestamp ?? 0
    }

    /**
     * @returns Confirmation count of the block that transaction
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const blockNumber = await this.getBlockNumber()
        const blockCount = await this.ethers.getBlockNumber()
        const confirmations = blockCount - blockNumber
        return confirmations < 0 ? 0 : confirmations
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()
        if (data?.response.blockNumber !== null && data?.receipt !== null) {
            if (data?.receipt.status === 1) {
                return TransactionStatusEnum.CONFIRMED
            } else {
                return TransactionStatusEnum.FAILED
            }
        }
        return TransactionStatusEnum.PENDING
    }
}
