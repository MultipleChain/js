import axios from 'axios'
import { checkWebSocket } from '@multiplechain/utils'
import { ErrorTypeEnum, type ProviderInterface } from '@multiplechain/types'

export interface BitcoinNetworkConfigInterface {
    testnet: boolean
    blockCypherToken?: string
}

export class Provider implements Omit<ProviderInterface, 'update'> {
    /**
     * Network configuration of the provider
     */
    network: BitcoinNetworkConfigInterface

    /**
     * API URL
     */
    api: string

    /**
     * Explorer URL
     */
    explorer: string

    /**
     * Websocket URL
     */
    wsUrl: string

    /**
     * BlockCypher token
     */
    blockCypherToken?: string

    /**
     * Static instance of the provider
     */
    private static _instance: Provider

    /**
     * @param network - Network configuration of the provider
     */
    constructor(network: BitcoinNetworkConfigInterface) {
        this.update(network)
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
     * @param {BitcoinNetworkConfigInterface} network - Network configuration of the provider
     * @returns {void}
     */
    static initialize(network: BitcoinNetworkConfigInterface): void {
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
            const response = await axios.get(url ?? this.createEndpoint('blocks/tip/height'))

            if (response.status !== 200) {
                return new Error(response.statusText + ': ' + JSON.stringify(response.data))
            }

            return true
        } catch (error) {
            return error as Error
        }
    }

    /**
     * Check WS connection
     * @param {string} url - Websocket URL
     * @returns {Promise<boolean | Error>}
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        try {
            const result: any = await checkWebSocket(url ?? this.wsUrl)

            if (result instanceof Error) {
                return result
            }

            return true
        } catch (error) {
            return error as Error
        }
    }

    /**
     * Update network configuration of the provider
     * @param network - Network configuration of the provider
     */
    update(network: BitcoinNetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        this.blockCypherToken = this.network.blockCypherToken
        if (this.network.testnet) {
            this.api = 'https://blockstream.info/testnet/api/'
            this.explorer = 'https://blockstream.info/testnet/'
            const token = this.network.blockCypherToken ?? '49d43a59a4f24d31a9731eb067ab971c'
            this.wsUrl = 'wss://socket.blockcypher.com/v1/btc/test3?token=' + token
        } else {
            this.api = 'https://blockstream.info/api/'
            this.explorer = 'https://blockstream.info/'
            if (this.network.blockCypherToken !== undefined) {
                this.wsUrl =
                    'wss://socket.blockcypher.com/v1/btc/main?token=' +
                    this.network.blockCypherToken
            } else {
                this.wsUrl = 'wss://ws.blockchain.info/inv'
            }
        }
    }

    /**
     * Create a new endpoint
     * @param {string} endpoint - Endpoint
     * @returns {string} Endpoint
     */
    createEndpoint(endpoint: string): string {
        return this.api + endpoint
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns boolean
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }
}
