import type {
    Block,
    BlockTag,
    EthersError,
    InterfaceAbi,
    JsonRpcSigner,
    TransactionReceipt,
    TransactionResponse
} from 'ethers'
import {
    ErrorTypeEnum,
    type BlockNumber,
    type ContractAddress,
    type PrivateKey,
    type TransactionId,
    type WalletAddress
} from '@multiplechain/types'
import { sleep, checkWebSocket } from '@multiplechain/utils'
import type { EvmNetworkConfigInterface } from './Provider'
import type { TransactionData } from '../services/TransactionSigner'
import { Wallet, Contract, ContractFactory, JsonRpcProvider, WebSocketProvider } from 'ethers'

export type { EthersError } from 'ethers'

export class Ethers {
    /**
     * Network configuration of the provider
     */
    network: EvmNetworkConfigInterface

    /**
     * JSON RPC provider
     */
    jsonRpcProvider: JsonRpcProvider

    /**
     * WebSocket provider
     */
    webSocketProvider?: WebSocketProvider

    /**
     * @param network - Network configuration of the provider
     */
    constructor(network: EvmNetworkConfigInterface) {
        this.network = network
        this.jsonRpcProvider = new JsonRpcProvider(network.rpcUrl)
    }

    /**
     * @returns Ethers jsonRpc provider
     */
    public get jsonRpc(): JsonRpcProvider {
        return this.jsonRpcProvider
    }

    /**
     * @returns Ethers webSocket provider
     */
    public get webSocket(): WebSocketProvider | undefined {
        return this.webSocketProvider
    }

    /**
     * @returns Ethers webSocket provider
     */
    public async connectWebSocket(): Promise<WebSocketProvider> {
        return await new Promise((resolve, reject) => {
            if (this.network.wsUrl === undefined) {
                reject(new Error(ErrorTypeEnum.WS_URL_NOT_DEFINED))
            } else {
                const url = this.network.wsUrl
                checkWebSocket(url)
                    .then((status: any) => {
                        if (status instanceof Error) {
                            reject(status)
                        } else {
                            resolve((this.webSocketProvider = new WebSocketProvider(url)))
                        }
                    })
                    .catch(reject)
            }
        })
    }

    /**
     * @param address contract address
     * @param abi contract abi
     * @param signer signer of the contract
     * @returns contract instance
     */
    public contract(
        address: string,
        abi: InterfaceAbi,
        signer?: JsonRpcSigner | JsonRpcProvider
    ): Contract {
        return new Contract(address, abi, signer)
    }

    /**
     * @param privateKey private key of the wallet
     * @param provider provider of the blockchain network
     * @returns wallet instance
     */
    public wallet(privateKey: PrivateKey, provider?: JsonRpcProvider): Wallet {
        return new Wallet(privateKey, provider ?? this.jsonRpc)
    }

    /**
     * @param abi contract abi
     * @param bytecode contract bytecode
     * @param signer signer of the contract
     * @returns contract factory instance
     */
    public contractFactory(
        abi: InterfaceAbi,
        bytecode: string,
        signer?: JsonRpcSigner | JsonRpcProvider
    ): ContractFactory {
        return new ContractFactory(abi, bytecode, signer)
    }

    /**
     * @param address contract address
     * @returns contract bytecode
     */
    async getByteCode(address: ContractAddress): Promise<string> {
        try {
            return await this.jsonRpc.getCode(address)
        } catch (error) {
            const e = error as EthersError
            if (e.code === 'UNCONFIGURED_NAME') {
                await sleep(1000)
                return await this.getByteCode(address)
            } else {
                throw error
            }
        }
    }

    /**
     * @param data transaction data
     * @returns transaction estimate gas
     */
    public async getEstimateGas(data: TransactionData): Promise<number> {
        return Number(await this.jsonRpcProvider.estimateGas(data))
    }

    /**
     * @returns gas price
     */
    public async getGasPrice(): Promise<string> {
        return (await this.jsonRpc.send('eth_gasPrice', [])).toString() as string
    }

    /**
     * @param address wallet address
     * @returns nonce of the wallet
     */
    public async getNonce(address: WalletAddress): Promise<number> {
        return await this.jsonRpcProvider.getTransactionCount(address)
    }

    /**
     * @param block block number or block hash
     * @param prefetchTxs whether to prefetch transactions
     * @returns block information
     */
    public async getBlock(block: BlockTag | string, prefetchTxs?: boolean): Promise<Block | null> {
        return await this.jsonRpcProvider.getBlock(block, prefetchTxs)
    }

    /**
     * @returns block number
     */
    async getBlockNumber(): Promise<BlockNumber> {
        return await this.jsonRpcProvider.getBlockNumber()
    }

    /**
     * @param id transaction id
     * @returns transaction information
     */
    async getTransaction(id: TransactionId): Promise<TransactionResponse | null> {
        return await this.jsonRpcProvider.getTransaction(id)
    }

    /**
     * @param id transaction id
     * @returns transaction receipt
     */
    async getTransactionReceipt(id: TransactionId): Promise<TransactionReceipt | null> {
        return await this.jsonRpcProvider.getTransactionReceipt(id)
    }

    /**
     * @param address wallet address
     * @param limit how many block to go back
     * @returns transactions
     */
    async getLastTransactions(
        address: WalletAddress,
        limit: number = 0
    ): Promise<TransactionResponse[]> {
        const txPromises = []
        const blockPromises = []
        const transactions: TransactionResponse[] = []

        const block = await this.getBlock('pending')
        const blockNumber = block?.number ?? (await this.getBlockNumber())

        for (let i = blockNumber; i > blockNumber - limit; i--) {
            const block = await this.getBlock(i, true)
            if (block === null) {
                continue
            }
            blockPromises.push(block)
        }

        const blocks = await Promise.all(blockPromises)
        for (const block of blocks) {
            for (const txHash of block.transactions) {
                txPromises.push(this.getTransaction(txHash))
            }
        }

        const txs = await Promise.all(txPromises)
        for (const tx of txs) {
            if (
                tx?.from.toLowerCase() === address.toLowerCase() ||
                tx?.to?.toLowerCase() === address.toLowerCase()
            ) {
                transactions.push(tx)
            }
        }

        return transactions
    }

    /**
     * @param address wallet address
     * @param limit how many block to go back
     * @returns last transaction
     */
    async getLastTransaction(
        address: WalletAddress,
        limit: number = 0
    ): Promise<TransactionResponse | null> {
        const block = await this.getBlock('pending')
        const blockNumber = block?.number ?? (await this.getBlockNumber())
        for (let i = blockNumber; i > blockNumber - limit; i--) {
            const block = await this.getBlock(i, true)
            if (block === null) {
                continue
            }
            for (const txId of block.transactions) {
                const tx = await this.getTransaction(txId)
                if (
                    tx?.from.toLowerCase() === address.toLowerCase() ||
                    tx?.to?.toLowerCase() === address.toLowerCase()
                ) {
                    return tx
                }
            }
        }

        return null
    }

    /**
     * @param address wallet address
     * @returns balance of the wallet
     */
    async getBalance(address: WalletAddress): Promise<bigint> {
        return await this.jsonRpcProvider.getBalance(address)
    }
}
