import type {
    Block,
    BlockTag,
    EthersError,
    JsonRpcSigner,
    TransactionReceipt,
    TransactionResponse
} from 'ethers'

import { Wallet, Contract, ContractFactory, JsonRpcProvider, WebSocketProvider } from 'ethers'

import { sleep } from '@multiplechain/utils'
import type { EvmNetworkConfigInterface } from './Provider.ts'
import type { TransactionData } from '../services/TransactionSigner.ts'

export class Ethers {
    network: EvmNetworkConfigInterface

    jsonRpcProvider: JsonRpcProvider

    webSocketProvider?: WebSocketProvider

    /**
     * @param {EvmNetworkConfigInterface} network
     */
    constructor(network: EvmNetworkConfigInterface) {
        this.network = network
        this.jsonRpcProvider = new JsonRpcProvider(network.rpcUrl)
        if (network.wsUrl !== undefined) {
            this.webSocketProvider = new WebSocketProvider(network.wsUrl)
        }
    }

    public get jsonRpc(): JsonRpcProvider {
        return this.jsonRpcProvider
    }

    public get webSocket(): WebSocketProvider | undefined {
        return this.webSocketProvider
    }

    /**
     * @param {String} address
     * @param {object[]} abi
     * @param {JsonRpcSigner} signer
     * @returns {Promise<Contract>}
     */
    public contract(
        address: string,
        abi: object[],
        signer?: JsonRpcSigner | JsonRpcProvider
    ): Contract {
        return new Contract(address, abi, signer)
    }

    /**
     * @param privateKey private key of the wallet
     * @param provider provider of the blockchain network
     * @returns {Wallet}
     */
    public wallet(privateKey: string, provider?: JsonRpcProvider): Wallet {
        return new Wallet(privateKey, provider ?? this.jsonRpc)
    }

    /**
     * @param {object[]} abi
     * @param {String} bytecode
     * @param {JsonRpcSigner} signer
     * @returns {Promise<ContractFactory>}
     */
    public contractFactory(
        abi: object[],
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
     * @param {String} address
     * @returns {Promise<bigint>}
     */
    async getBalance(address: string): Promise<bigint> {
        return await this.jsonRpcProvider.getBalance(address)
    }
}
