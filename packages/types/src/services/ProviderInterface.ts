/**
 * wsUrl: Websocket URL
 * rpcUrl: RPC URL of the blockchain network
 * testnet: @default true
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
     * @returns {Promise<boolean>}
     */
    checkRpcConnection: (url?: string) => Promise<boolean>

    /**
     * Check WS connection
     * @param {string} url - Websocket URL
     * @returns {Promise<boolean>}
     */
    checkWsConnection: (url?: string) => Promise<boolean>
}
