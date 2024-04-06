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

export interface ProviderInterface {
    /**
     * Network configuration of the provider
     */
    network: NetworkConfigInterface

    /**
     * Update network configuration of the provider
     * @param {NetworkConfigInterface} network - Network configuration
     */
    update: (network: NetworkConfigInterface) => void

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
