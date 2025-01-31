import Client from './Client'
import { Client as WsClient, type Memo } from 'xrpl'
import { checkWebSocket } from '@multiplechain/utils'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'

export class Provider implements ProviderInterface<NetworkConfigInterface> {
    /**
     * Network configuration of the provider
     */
    network: NetworkConfigInterface

    ws: WsClient

    rpc: Client

    explorer: string

    testnetRpc = 'https://s.altnet.rippletest.net:51234'

    testnetWs = 'wss://s.altnet.rippletest.net:51233'

    mainnetRpc = 'https://xrplcluster.com'

    mainnetWs = 'wss://xrplcluster.com'

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
     * @returns Provider
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
     * @returns Connection status
     */
    async checkRpcConnection(url?: string): Promise<boolean | Error> {
        try {
            const response = await fetch(url ?? this.network.rpcUrl ?? '', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method: 'server_info',
                    params: []
                })
            })

            if (response.status !== 200) {
                return new Error(response.statusText + ': ' + response.status)
            }

            return true
        } catch (error) {
            return error as Error
        }
    }

    /**
     * Check WS connection
     * @param url - Websocket URL
     * @returns Connection status
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        try {
            const result: any = await checkWebSocket(url ?? this.network.wsUrl ?? '')

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
     * @param network - Network configuration
     */
    update(network: NetworkConfigInterface): void {
        this.network = network
        Provider._instance = this
        if (!network.wsUrl) {
            throw new Error(ErrorTypeEnum.WS_URL_NOT_DEFINED)
        }
        if (!network.rpcUrl) {
            throw new Error('RPC URL is not defined')
        }
        this.ws = new WsClient(network.wsUrl)
        this.rpc = new Client(network.rpcUrl)
        this.explorer = network.testnet ? 'https://testnet.xrpl.org/' : 'https://livenet.xrpl.org/'
        if (!network.rpcUrl) {
            this.network.rpcUrl = network.testnet ? this.testnetRpc : this.mainnetRpc
        }
        if (!network.wsUrl) {
            this.network.wsUrl = network.testnet ? this.testnetWs : this.mainnetWs
        }
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns Testnet or not
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }

    /**
     * Create memo object
     * @param memo - Memo data
     * @returns Memo object
     */
    createMemo(memo: string): Memo {
        return {
            Memo: {
                MemoData: Buffer.from(memo).toString('hex'),
                MemoType: Buffer.from('text').toString('hex')
            }
        }
    }
}
