import { Ethers } from './Ethers.ts'
import type { NetworkConfigInterface, ProviderInterface } from '@multiplechain/types'

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

export class Provider implements Omit<ProviderInterface, 'update' | 'network'> {
    /**
     * Network configuration of the provider
     */
    private network: EvmNetworkConfigInterface

    /**
     * Ethers service
     */
    private _ethers: Ethers

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
        this._ethers = new Ethers(network)
    }

    /**
     * @returns Ethers service instance
     */
    get ethers(): Ethers {
        return this._ethers
    }

    /**
     * Get the static instance of the provider
     * @returns Provider
     */
    static get instance(): Provider {
        if (Provider._instance === undefined) {
            throw new Error('Provider is not initialized')
        }
        return Provider._instance
    }

    /**
     * Initialize the static instance of the provider
     * @param network - Network configuration of the provider
     */
    static initialize(network: EvmNetworkConfigInterface): void {
        Provider._instance = new Provider(network)
    }

    /**
     * Update network configuration of the provider
     * @param network - Network configuration of the provider
     */
    update(network: EvmNetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this._ethers = new Ethers(network)
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns boolean
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
