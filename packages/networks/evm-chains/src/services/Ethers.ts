import type {
    Block,
    BlockTag,
    JsonRpcSigner,
    TransactionReceipt,
    TransactionResponse
} from 'ethers'

import { Contract, ContractFactory, JsonRpcProvider, WebSocketProvider } from 'ethers'

import { toHex } from '@multiplechain/utils'

import type { EvmNetworkConfigInterface } from './Provider.ts'

declare module 'ethers' {
    interface JsonRpcProvider {
        getGasPrice: () => Promise<number>
    }
}

export class Ethers {
    network: EvmNetworkConfigInterface

    jsonRpcProvider: JsonRpcProvider

    websocketProvider?: WebSocketProvider

    /**
     * @param {EvmNetworkConfigInterface} network
     */
    constructor(network: EvmNetworkConfigInterface) {
        this.network = network
        this.jsonRpcProvider = new JsonRpcProvider(network.rpcUrl)
        if (network.wsUrl !== undefined) {
            this.websocketProvider = new WebSocketProvider(network.wsUrl)
        }
    }

    get getJsonRpc(): JsonRpcProvider {
        return this.jsonRpcProvider
    }

    get getWebsocket(): WebSocketProvider | undefined {
        return this.websocketProvider
    }

    /**
     * @param {String} address
     * @param {object[]} abi
     * @param {JsonRpcSigner} provider
     * @returns {Object}
     */
    public contract(address: string, abi: object[], provider?: JsonRpcSigner): Contract {
        return new Contract(address, abi, provider)
    }

    /**
     * @param {object[]} abi
     * @param {String} bytecode
     * @param {JsonRpcSigner} provider
     * @returns {Object}
     */
    public contractFactory(
        abi: object[],
        bytecode: string,
        provider?: JsonRpcSigner
    ): ContractFactory {
        return new ContractFactory(abi, bytecode, provider)
    }

    /**
     * @param {Object} data
     * @returns {Promise<string>}
     */
    public async getEstimateGas(data: object): Promise<string> {
        return toHex((await this.jsonRpcProvider.estimateGas(data)).toString())
    }

    /**
     * @returns {Promise<string>}
     */
    public async getGasPrice(): Promise<string> {
        return toHex((await this.jsonRpcProvider.getGasPrice()).toString())
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
