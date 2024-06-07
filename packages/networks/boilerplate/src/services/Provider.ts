import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'

export class Provider implements ProviderInterface {
    /**
     * Network configuration of the provider
     */
    network: NetworkConfigInterface

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
        return true
    }

    /**
     * Check WS connection
     * @param url - Websocket URL
     * @returns ws connection status
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        return true
    }

    /**
     * Update network configuration of the provider
     * @param network - Network configuration
     */
    update(network: NetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns testnet status
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
