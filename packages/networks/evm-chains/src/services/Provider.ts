import { Ethers } from './Ethers'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'

import { checkWebSocket } from '@multiplechain/utils'
import { JsonRpcProvider } from 'ethers'

export interface EvmNetworkConfigInterface extends NetworkConfigInterface {
    id: number
    hexId?: string
    rpcUrl: string
    name?: string
    mainnetId?: number
    explorerUrl: string
    nativeCurrency: {
        name?: string
        symbol: string
        decimals: number
    }
}

export class Provider implements ProviderInterface<EvmNetworkConfigInterface> {
    /**
     * Network configuration of the provider
     */
    public network: EvmNetworkConfigInterface

    /**
     * Ethers service
     */
    public ethers: Ethers

    /**
     * Static instance of the provider
     */
    private static _instance: Provider

    /**
     * @param network - Network configuration of the provider
     */
    constructor(network: EvmNetworkConfigInterface) {
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
    static initialize(network: EvmNetworkConfigInterface): void {
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
            const rpc = new JsonRpcProvider(url ?? this.network.rpcUrl ?? '')
            await rpc.getBlockNumber()
            return true
        } catch (error) {
            return error as any
        }
    }

    /**
     * Check WS connection
     * @param url - Websocket URL
     * @returns WS connection status
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        try {
            const result: any = await checkWebSocket(url ?? this.network.wsUrl ?? '')

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
    update(network: EvmNetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this.ethers = new Ethers(network)
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns Testnet status
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
