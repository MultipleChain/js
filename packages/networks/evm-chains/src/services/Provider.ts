import { Ethers } from './Ethers.ts'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'

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
