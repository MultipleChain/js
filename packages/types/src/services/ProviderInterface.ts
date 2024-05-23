/**
 * wsUrl: Websocket URL
 * rpcUrl: RPC API URL
 * testnet: @default false
 */
export interface NetworkConfigInterface {
    wsUrl?: string
    rpcUrl?: string
    testnet?: boolean
}

export interface ProviderInterface<NetworkConfig = NetworkConfigInterface> {
    /**
     * Network configuration of the provider
     */
    network: NetworkConfig

    /**
     * Update network configuration of the provider
     * @param {NetworkConfig} network - Network configuration
     */
    update: (network: NetworkConfig) => void

    /**
     * Get the current network configuration is testnet or not
     * @returns {boolean}
     */
    isTestnet: () => boolean

    /**
     * Check RPC connection
     * @param {string} url - RPC URL
     * @returns {Promise<boolean | Error>}
     */
    checkRpcConnection: (url?: string) => Promise<boolean | Error>

    /**
     * Check WS connection
     * @param {string} url - Websocket URL
     * @returns {Promise<boolean | Error>}
     */
    checkWsConnection: (url?: string) => Promise<boolean | Error>
}
