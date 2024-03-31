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
        this.network = network
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
     * @param {NetworkConfigInterface} network - Network configuration of the provider
     * @returns {void}
     */
    static initialize(network: NetworkConfigInterface): void {
        if (Provider._instance !== undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_ALREADY_INITIALIZED)
        }
        Provider._instance = new Provider(network)
    }

    /**
     * Update network configuration of the provider
     * @param network - Network configuration of the provider
     */
    update(network: NetworkConfigInterface): void {
        this.network = network
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns boolean
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
