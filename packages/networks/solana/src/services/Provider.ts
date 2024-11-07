import axios from 'axios'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'
import { Connection } from '@solana/web3.js'
import { checkWebSocket } from '@multiplechain/utils'

export interface SolanaNodeInfoInterface {
    name: string
    cluster: string
    wsUrl?: string
    rpcUrl: string
    explorerUrl: string
}

export type SolanaNodeInfoListInterface = Record<string, SolanaNodeInfoInterface>

export class Provider implements ProviderInterface {
    /**
     * Network configuration of the provider
     */
    network: NetworkConfigInterface

    /**
     * Node list
     */
    nodes: SolanaNodeInfoListInterface = {
        mainnet: {
            name: 'Mainnet',
            cluster: 'mainnet-beta',
            rpcUrl: 'https://api.mainnet-beta.solana.com/',
            explorerUrl: 'https://solscan.io/'
        },
        devnet: {
            name: 'Devnet',
            cluster: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com/',
            explorerUrl: 'https://solscan.io/'
        }
    }

    /**
     * Web3 connection
     */
    web3: Connection

    /**
     * Node information
     */
    node: SolanaNodeInfoInterface

    /**
     * Static instance of the provider
     */
    private static _instance: Provider

    /**
     * @param network - Network configuration of the provider
     */
    constructor(network: NetworkConfigInterface) {
        this.update(network)
    }

    /**
     * Get the static instance of the provider
     * @returns Provider
     */
    static get instance(): Provider {
        if (Provider._instance === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_NOT_INITIALIZED)
        }
        return Provider._instance
    }

    /**
     * Initialize the static instance of the provider
     * @param network - Network configuration of the provider
     */
    static initialize(network: NetworkConfigInterface): void {
        if (Provider._instance !== undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_ALREADY_INITIALIZED)
        }
        Provider._instance = new Provider(network)
    }

    /**
     * Check RPC connection
     * @param url - RPC URL
     * @returns Connection status
     */
    async checkRpcConnection(url?: string): Promise<boolean | Error> {
        try {
            const response = await axios.post(url ?? this.node.rpcUrl, {
                jsonrpc: '2.0',
                id: 1,
                method: 'getEpochInfo'
            })

            if (response.status !== 200) {
                return new Error(response.statusText + ': ' + JSON.stringify(response.data))
            }

            return true
        } catch (error) {
            return error as any
        }
    }

    /**
     * Check WS connection
     * @param url - Websocket URL
     * @returns Connection status
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        try {
            const wsUrl = url ?? this.node.wsUrl ?? ''

            if (wsUrl === '' || wsUrl === undefined) {
                return new Error(ErrorTypeEnum.WS_URL_NOT_DEFINED)
            }

            const result: any = await checkWebSocket(wsUrl)

            if (result instanceof Error) {
                return result
            }

            return true
        } catch (error) {
            return error as Error
        }
    }

    /**
     * Update network configuration of the provider
     * @param network - Network configuration of the provider
     */
    update(network: NetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this.node = this.nodes[network.testnet ?? false ? 'devnet' : 'mainnet']
        this.node.rpcUrl = this.network.rpcUrl ?? this.node.rpcUrl
        this.node.wsUrl = this.network.wsUrl ?? this.node.wsUrl
        this.web3 = new Connection(this.node.rpcUrl, {
            wsEndpoint: this.node.wsUrl
        })
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns Testnet status
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
