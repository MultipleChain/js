import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'
import { TronWeb } from './TronWeb'

export interface TronNodeInfoInterface {
    id: string
    node: string
    name: string
    host: string
    event: string
    explorer: string
}

export type TronNodeInfoListInterface = Record<string, TronNodeInfoInterface>

export class Provider implements ProviderInterface {
    /**
     * Network configuration of the provider
     */
    network: NetworkConfigInterface

    /**
     * Node list
     */
    nodes: TronNodeInfoListInterface = {
        mainnet: {
            id: '0x2b6653dc',
            node: 'mainnet',
            name: 'TronGrid Mainnet',
            host: 'https://api.trongrid.io',
            event: 'https://api.trongrid.io',
            explorer: 'https://tronscan.org/'
        },
        testnet: {
            id: '0xcd8690dc',
            node: 'testnet',
            name: 'TronGrid Nile Testnet',
            host: 'https://nile.trongrid.io',
            event: 'https://event.nileex.io',
            explorer: 'https://nile.tronscan.org/'
        }
    }

    /**
     * Node information
     */
    node: TronNodeInfoInterface

    /**
     * TronWeb instance
     */
    tronWeb: TronWeb

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
     * @param _url - RPC URL
     * @returns RPC connection status
     */
    async checkRpcConnection(_url?: string): Promise<boolean | Error> {
        return (await this.tronWeb.isConnected()).fullNode
    }

    /**
     * Check WS connection
     * @param _url - Websocket URL
     * @returns WS connection status
     */
    async checkWsConnection(_url?: string): Promise<boolean | Error> {
        return (await this.tronWeb.isConnected()).eventServer
    }

    /**
     * Update network configuration of the provider
     * @param network - Network configuration of the provider
     */
    update(network: NetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this.node = this.nodes[network.testnet ?? false ? 'testnet' : 'mainnet']
        this.node.host = this.network.rpcUrl ?? this.node.host
        this.node.event = this.network.wsUrl ?? this.node.event
        this.tronWeb = new TronWeb({
            fullNode: this.node.host,
            solidityNode: this.node.host,
            eventServer: this.node.event
        })
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns Testnet or not
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
