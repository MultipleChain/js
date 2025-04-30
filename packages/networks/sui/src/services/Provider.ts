import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'
import { checkWebSocket } from '@multiplechain/utils'
import { SuiClient, SuiHTTPTransport } from '@mysten/sui/client'

export interface SolanaNodeInfoInterface {
    name: string
    wsUrl?: string
    rpcUrl: string
    explorerUrl: string
    mode: 'mainnet' | 'testnet'
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
            mode: 'mainnet',
            wsUrl: 'wss://rpc.mainnet.sui.io:443',
            rpcUrl: 'https://fullnode.mainnet.sui.io:443',
            explorerUrl: 'https://suiscan.xyz/mainnet/'
        },
        testnet: {
            name: 'Testnet',
            mode: 'testnet',
            wsUrl: 'wss://rpc.testnet.sui.io:443',
            rpcUrl: 'https://fullnode.testnet.sui.io:443',
            explorerUrl: 'https://suiscan.xyz/testnet/'
        }
    }

    /**
     * Node information
     */
    node: SolanaNodeInfoInterface

    /**
     * Sui client
     */
    client: SuiClient

    /**
     * Transport
     */
    transport: SuiHTTPTransport

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
     * @returns Provider instance
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
     * @returns RPC connection status
     */
    async checkRpcConnection(url?: string): Promise<boolean | Error> {
        try {
            const client = new SuiClient({ url: url ?? this.node.rpcUrl })
            await client.getObject({
                id: '0x1'
            })
            return true
        } catch (error) {
            return error as any
        }
    }

    /**
     * Check WS connection
     * @param url - Websocket URL
     * @returns ws connection status
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
     * @param network - Network configuration
     */
    update(network: NetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this.node = this.nodes[network.testnet ?? false ? 'testnet' : 'mainnet']
        this.node.rpcUrl = this.network.rpcUrl ?? this.node.rpcUrl
        this.node.wsUrl = this.network.wsUrl ?? this.node.wsUrl
        this.transport = new SuiHTTPTransport({
            url: this.node.rpcUrl,
            rpc: {
                url: this.node.rpcUrl
            },
            websocket: {
                url: this.node.wsUrl
            }
        })
        this.client = new SuiClient({
            network: this.node.mode,
            transport: this.transport
        })
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns testnet status
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
