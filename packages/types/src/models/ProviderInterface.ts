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
