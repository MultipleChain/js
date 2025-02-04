import { fromLamports } from '../utils'
import { Provider } from '../services/Provider'
import { ErrorTypeEnum, TransactionStatusEnum } from '@multiplechain/types'
import {
    SystemProgram,
    type ParsedInstruction,
    type ParsedTransactionWithMeta
} from '@solana/web3.js'
import {
    type BlockTimestamp,
    type BlockNumber,
    type TransactionFee,
    type TransactionId,
    type TransactionInterface,
    type WalletAddress,
    type BlockConfirmationCount,
    TransactionTypeEnum
} from '@multiplechain/types'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export class Transaction implements TransactionInterface<ParsedTransactionWithMeta> {
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
    data: ParsedTransactionWithMeta | null = null

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
            console.error('MC Solana TX getData', error)
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
                    console.error('MC Solana TX wait', error)
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

        const instructions = data.transaction.message.instructions as ParsedInstruction[]

        return await new Promise((resolve) => {
            instructions.forEach((instruction, index) => {
                if (instruction.programId.equals(TOKEN_2022_PROGRAM_ID)) {
                    resolve(TransactionTypeEnum.TOKEN)
                } else if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
                    const postBalance = data.meta?.postTokenBalances?.find(
                        (balance: any): boolean => {
                            return balance.mint !== undefined
                        }
                    )

                    if (postBalance?.uiTokenAmount.decimals === 0) {
                        resolve(TransactionTypeEnum.NFT)
                    } else {
                        resolve(TransactionTypeEnum.TOKEN)
                    }
                } else if (
                    instruction.programId.equals(SystemProgram.programId) &&
                    (instruction.parsed.type === 'createAccount' ||
                        instruction.parsed.type === 'transfer')
                ) {
                    resolve(TransactionTypeEnum.COIN)
                }

                if (index === instructions.length - 1) {
                    resolve(TransactionTypeEnum.CONTRACT)
                }
            })
        })
    }

    /**
     * @returns Transaction URL
     */
    getUrl(): string {
        const node = this.provider.node
        let transactionUrl = this.provider.node.explorerUrl + 'tx/' + this.id
        transactionUrl += node.cluster !== 'mainnet-beta' ? '?cluster=' + node.cluster : ''
        return transactionUrl
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSigner(): Promise<WalletAddress> {
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
     * @returns Transaction fee
     */
    async getFee(): Promise<TransactionFee> {
        const data = await this.getData()
        return fromLamports(data?.meta?.fee ?? 0)
    }

    /**
     * @returns Block number that transaction
     */
    async getBlockNumber(): Promise<BlockNumber> {
        const data = await this.getData()
        return data?.slot ?? 0
    }

    /**
     * @returns Block timestamp that transaction
     */
    async getBlockTimestamp(): Promise<BlockTimestamp> {
        const data = await this.getData()
        return data?.blockTime ?? 0
    }

    /**
     * @returns Confirmation count of the block
     */
    async getBlockConfirmationCount(): Promise<BlockConfirmationCount> {
        const data = await this.getData()
        const currentSlot = await this.provider.web3.getSlot()
        return currentSlot - (data?.slot ?? 0)
    }

    /**
     * @returns Status of the transaction
     */
    async getStatus(): Promise<TransactionStatusEnum> {
        const data = await this.getData()

        if (data === null) {
            return TransactionStatusEnum.PENDING
        }

        if (data.meta?.err !== null) {
            console.error('MC Solana TX getStatus', data.meta?.err)
            return TransactionStatusEnum.FAILED
        } else {
            return TransactionStatusEnum.CONFIRMED
        }
    }
}
