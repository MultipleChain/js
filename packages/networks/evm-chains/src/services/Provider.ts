import { Ethers } from './Ethers.ts'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'

import { checkWebSocket } from '@multiplechain/utils'

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

export class Provider implements Omit<ProviderInterface, 'update'> {
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
        this.network = network
        Provider._instance = this
        this.ethers = new Ethers(network)
    }

    /**
     * Get the static instance of the provider
     * @returns {Provider} Provider
     */
    static get instance(): Provider {
        if (Provider._instance === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_NOT_INITIALIZED)
        }
        return Provider._instance
    }

    /**
     * Initialize the static instance of the provider
     * @param {EvmNetworkConfigInterface} network - Network configuration of the provider
     * @returns {void}
     */
    static initialize(network: EvmNetworkConfigInterface): void {
        if (Provider._instance !== undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_ALREADY_INITIALIZED)
        }
        Provider._instance = new Provider(network)
    }

    /**
     * Check RPC connection
     * @param {string} url - RPC URL
     * @returns {Promise<boolean | Error>}
     */
    async checkRpcConnection(url?: string): Promise<boolean | Error> {
        try {
            const response = await fetch(url ?? this.network.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getChainId',
                    params: [],
                    id: 1
                })
            })

            if (!response.ok) {
                return new Error(response.statusText + ': ' + (await response.text()))
            }

            return true
        } catch (error) {
            return error as any
        }
    }

    /**
     * Check WS connection
     * @param {string} url - Websocket URL
     * @returns {Promise<boolean | Error>}
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        try {
            const result = await checkWebSocket(url ?? this.network.rpcUrl)

            if (result === true) {
                return true
            }

            return new Error(result as string)
        } catch (error) {
            return error as Error
        }
    }

    /**
     * Update network configuration of the provider
     * @param {EvmNetworkConfigInterface} network - Network configuration of the provider
     * @returns {void}
     */
    update(network: EvmNetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this.ethers = new Ethers(network)
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns {boolean}
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
