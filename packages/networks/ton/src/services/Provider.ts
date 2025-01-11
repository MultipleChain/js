import axios from 'axios'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'
import TonCenterV3 from 'ton-center-v3'
import { TonClient, TonClient4 } from '@ton/ton'

export interface TonNetworkConfigInterface extends NetworkConfigInterface {
    apiKey: string
    workchain?: number
    explorer?: 'tonviewer' | 'tonscan'
}

export enum TonNetwork {
    MAINNET = -239,
    TESTNET = -3
}

export class Provider implements ProviderInterface<TonNetworkConfigInterface> {
    /**
     * Network configuration of the provider
     */
    network: TonNetworkConfigInterface

    client1: TonClient

    client3: TonCenterV3

    client4: TonClient4

    mainnetEndpoint = 'https://toncenter.com/api/v2/jsonRPC'

    testnetEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'

    tonViewerMainnet = 'https://tonviewer.com/transaction/'

    tonViewerTestnet = 'https://testnet.tonviewer.com/transaction/'

    tonScanMainnet = 'https://tonscan.org/tx/'

    tonScanTestnet = 'https://testnet.tonscan.org/tx/'

    explorerUrl: string

    workchain: number

    public walletStandard: {
        testOnly: boolean
        bounceable: boolean
    }

    public contractStandard: {
        testOnly: boolean
        bounceable: boolean
    }

    /**
     * Static instance of the provider
     */
    private static _instance: Provider

    /**
     * @param network - Network configuration of the provider
     */
    constructor(network: TonNetworkConfigInterface) {
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
    static initialize(network: TonNetworkConfigInterface): void {
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
        try {
            await this.client1.getMasterchainInfo()
            await this.client3.getMasterchainInfo()
            await this.client4.getLastBlock()

            if (url) {
                const response = await axios.get(url)

                if (response.status !== 200) {
                    return new Error(response.statusText + ': ' + JSON.stringify(response.data))
                }
            }

            return true
        } catch (error) {
            return error as Error
        }
    }

    /**
     * Check WS connection
     * @param url - Websocket URL
     * @returns ws connection status
     */
    async checkWsConnection(url?: string): Promise<boolean | Error> {
        try {
            if (url) {
                const response = await axios.get(url)

                if (response.status !== 200) {
                    return new Error(response.statusText + ': ' + JSON.stringify(response.data))
                }
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
    update(network: TonNetworkConfigInterface): void {
        const apiKey = network.apiKey ?? ''
        const testnet = network.testnet ?? false
        const explorer = network.explorer ?? 'tonscan'
        const endpoint = testnet ? this.testnetEndpoint : this.mainnetEndpoint

        if (!apiKey) {
            throw new Error('TonCenter API key is required')
        }

        this.client1 = new TonClient({
            endpoint,
            apiKey
        })

        this.client4 = new TonClient4({
            endpoint,
            requestInterceptor: (config) => {
                config.headers['X-API-KEY'] = apiKey
                return config
            }
        })

        this.client3 = new TonCenterV3({
            apiKey,
            testnet
        })

        if (explorer === 'tonscan') {
            this.explorerUrl = testnet ? this.tonScanTestnet : this.tonScanMainnet
        } else {
            this.explorerUrl = testnet ? this.tonViewerTestnet : this.tonViewerMainnet
        }

        this.walletStandard = {
            testOnly: testnet,
            bounceable: false
        }

        this.contractStandard = {
            testOnly: testnet,
            bounceable: true
        }

        this.network = network

        this.workchain = network.workchain ?? 0

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
