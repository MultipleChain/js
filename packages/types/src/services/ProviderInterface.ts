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
     */
    update: (config: NetworkConfigInterface) => void
}