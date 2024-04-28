import type {
    Block,
    BlockTag,
    EthersError,
    InterfaceAbi,
    JsonRpcSigner,
    TransactionReceipt,
    TransactionResponse
} from 'ethers'
import { sleep, checkWebSocket } from '@multiplechain/utils'
import type { EvmNetworkConfigInterface } from './Provider.ts'
import type { TransactionData } from '../services/TransactionSigner.ts'
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
     * @param {EvmNetworkConfigInterface} network
     */
    constructor(network: EvmNetworkConfigInterface) {
        this.network = network
        this.jsonRpcProvider = new JsonRpcProvider(network.rpcUrl)
    }

    /**
     * @returns {JsonRpcProvider}
     */
    public get jsonRpc(): JsonRpcProvider {
        return this.jsonRpcProvider
    }

    /**
     * @returns {WebSocketProvider | undefined}
     */
    public get webSocket(): WebSocketProvider | undefined {
        return this.webSocketProvider
    }

    /**
     * @returns {WebSocketProvider}
     */
    public async connectWebSocket(): Promise<WebSocketProvider> {
        return await new Promise((resolve, reject) => {
            if (this.network.wsUrl === undefined) {
                reject(new Error('WebSocket URL is not defined'))
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
     * @param {String} address
     * @param {InterfaceAbi} abi
     * @param {JsonRpcSigner} signer
     * @returns {Promise<Contract>}
     */
    public contract(
        address: string,
        abi: InterfaceAbi,
        signer?: JsonRpcSigner | JsonRpcProvider
    ): Contract {
        return new Contract(address, abi, signer)
    }

    /**
     * @param {string} privateKey private key of the wallet
     * @param {JsonRpcProvider} provider provider of the blockchain network
     * @returns {Wallet}
     */
    public wallet(privateKey: string, provider?: JsonRpcProvider): Wallet {
        return new Wallet(privateKey, provider ?? this.jsonRpc)
    }

    /**
     * @param {InterfaceAbi} abi
     * @param {String} bytecode
     * @param {JsonRpcSigner} signer
     * @returns {Promise<ContractFactory>}
     */
    public contractFactory(
        abi: InterfaceAbi,
        bytecode: string,
        signer?: JsonRpcSigner | JsonRpcProvider
    ): ContractFactory {
        return new ContractFactory(abi, bytecode, signer)
    }

    /**
     * @param {string} address
     * @returns {Promise<string>}
     */
    async getByteCode(address: string): Promise<string> {
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
     * @param {Object} data
     * @returns {Promise<number>}
     */
    public async getEstimateGas(data: TransactionData): Promise<number> {
        return Number(await this.jsonRpcProvider.estimateGas(data))
    }

    /**
     * @returns {Promise<string>}
     */
    public async getGasPrice(): Promise<string> {
        return (await this.jsonRpc.send('eth_gasPrice', [])).toString() as string
    }

    /**
     * @param {String} address
     * @returns {Promise<number>}
     */
    public async getNonce(address: string): Promise<number> {
        return await this.jsonRpcProvider.getTransactionCount(address)
    }

    /**
     * @param {BlockTag | string} block
     * @param {boolean} prefetchTxs
     * @returns {Promise<Block | null>}
     */
    public async getBlock(block: BlockTag | string, prefetchTxs?: boolean): Promise<Block | null> {
        return await this.jsonRpcProvider.getBlock(block, prefetchTxs)
    }

    /**
     * @returns {Promise<number>}
     */
    async getBlockNumber(): Promise<number> {
        return await this.jsonRpcProvider.getBlockNumber()
    }

    /**
     * @param {String} id
     * @returns {Promise<null | TransactionResponse>}
     */
    async getTransaction(id: string): Promise<null | TransactionResponse> {
        return await this.jsonRpcProvider.getTransaction(id)
    }

    /**
     * @param {String} id
     * @returns {Promise<null | TransactionReceipt>}
     */
    async getTransactionReceipt(id: string): Promise<null | TransactionReceipt> {
        return await this.jsonRpcProvider.getTransactionReceipt(id)
    }

    /**
     * @param {string} address
     * @param {number} limit how many block to go back
     * @returns {Promise<TransactionResponse[]>}
     */
    async getLastTransactions(address: string, limit: number = 0): Promise<TransactionResponse[]> {
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
     * @param {String} address
     * @param {number} limit
     * @returns {Promise<TransactionResponse | null>}
     */
    async getLastTransaction(
        address: string,
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
     * @param {String} address
     * @returns {Promise<bigint>}
     */
    async getBalance(address: string): Promise<bigint> {
        return await this.jsonRpcProvider.getBalance(address)
    }
}
