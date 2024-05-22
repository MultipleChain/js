import { fromLamports } from '../utils.ts'
import { Provider } from '../services/Provider.ts'
import type { TransactionInterface } from '@multiplechain/types'
import type { ParsedTransactionWithMeta } from '@solana/web3.js'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'

export class Transaction implements TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * Blockchain network provider
     */
    provider: Provider

    data: ParsedTransactionWithMeta | null = null

    /**
     * @param {string} id Transaction id
     * @param {Provider} provider Blockchain network provider
     */
    constructor(id: string, provider?: Provider) {
        this.id = id
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {Promise<object | null>} Transaction data
     */
    async getData(): Promise<ParsedTransactionWithMeta | null> {
        if (this.data !== null) {
            return this.data
        }
        try {
            const data = await this.provider.web3.getParsedTransaction(this.id, {
                commitment: 'confirmed'
            })

            if (data === null) {
                return null
            }

            return (this.data = data)
        } catch (error) {
            throw new Error(ErrorTypeEnum.RPC_REQUEST_ERROR)
        }
    }

    /**
     * @param {number} ms - Milliseconds to wait for the transaction to be confirmed. Default is 4000ms
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async wait(ms: number = 4000): Promise<TransactionStatusEnum> {
        return await new Promise((resolve, reject) => {
            const check = async (): Promise<void> => {
                try {
                    let status = await this.getStatus()
                    if (status === TransactionStatusEnum.PENDING) {
                        const latestBlockHash = await this.provider.web3.getLatestBlockhash()
                        await this.provider.web3.confirmTransaction(
                            {
                                signature: this.id,
                                blockhash: latestBlockHash.blockhash,
                                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight
                            },
                            'finalized'
                        )
                        status = await this.getStatus()
                    }
                    if (status === TransactionStatusEnum.CONFIRMED) {
                        resolve(TransactionStatusEnum.CONFIRMED)
                        return
                    } else if (status === TransactionStatusEnum.FAILED) {
                        reject(TransactionStatusEnum.FAILED)
                        return
                    }
                    setTimeout(check, ms)
                } catch (error) {
                    reject(TransactionStatusEnum.FAILED)
                }
            }
            void check()
        })
    }

    /**
     * @returns {string} Transaction ID
     */
    getId(): string {
        return this.id
    }

    /**
     * @returns {string} Transaction URL
     */
    getUrl(): string {
        const node = this.provider.node
        let transactionUrl = this.provider.node.explorerUrl + 'tx/' + this.id
        transactionUrl += node.cluster !== 'mainnet-beta' ? '?cluster=' + node.cluster : ''
        return transactionUrl
    }

    /**
     * @returns {Promise<string>} Wallet address of the sender of transaction
     */
    async getSigner(): Promise<string> {
        const data = await this.getData()
        return (
            data?.transaction?.message?.accountKeys
                .find((account) => {
                    return account.signer
                })
                ?.pubkey.toBase58() ?? ''
        )
    }

    /**
     * @returns {Promise<number>} Transaction fee
     */
    async getFee(): Promise<number> {
        const data = await this.getData()
        return fromLamports(data?.meta?.fee ?? 0)
    }

    /**
     * @returns {Promise<number>} Block number that transaction
     */
    async getBlockNumber(): Promise<number> {
        const data = await this.getData()
        return data?.slot ?? 0
    }

    /**
     * @returns {Promise<number>} Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<number> {
        const data = await this.getData()
        return data?.blockTime ?? 0
    }

    /**
     * @returns {Promise<number>} Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<number> {
        const data = await this.getData()
        const currentSlot = await this.provider.web3.getSlot()
        return currentSlot - (data?.slot ?? 0)
    }

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()

        if (data === null) {
            return TransactionStatusEnum.PENDING
        }

        return data.meta?.err !== null
            ? TransactionStatusEnum.FAILED
            : TransactionStatusEnum.CONFIRMED
    }
}
