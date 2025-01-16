import axios from 'axios'
import {
    ErrorTypeEnum,
    type NetworkConfigInterface,
    type ProviderInterface
} from '@multiplechain/types'
import TonCenterV3 from 'ton-center-v3'
import {
    TonClient,
    WalletContractV3R1,
    WalletContractV3R2,
    WalletContractV4,
    WalletContractV5Beta,
    WalletContractV5R1
} from '@ton/ton'

export interface TonNetworkConfigInterface extends NetworkConfigInterface {
    apiKey: string
    workchain?: number
    explorer?: 'tonviewer' | 'tonscan'
}

export enum Network {
    MAINNET = -239,
    TESTNET = -3
}

export enum OpCodes {
    JETTON_TRANSFER = 0xf8a7ea5,
    NFT_TRANSFER = 0x5fcc3d14,
    STONFI_SWAP = 0x25938561
}

export enum WalletVersion {
    V3R1 = 0,
    V3R2 = 1,
    V4R1 = 2,
    V4R2 = 3,
    V5_BETA = 4,
    V5R1 = 5
}

export type WalletContract =
    | WalletContractV3R1
    | WalletContractV3R2
    | WalletContractV4
    | WalletContractV5Beta
    | WalletContractV5R1

export class Provider implements ProviderInterface<TonNetworkConfigInterface> {
    /**
     * Network configuration of the provider
     */
    network: TonNetworkConfigInterface

    client1: TonClient

    client3: TonCenterV3

    mainnetEndpoint = 'https://toncenter.com/api/v2/jsonRPC'

    testnetEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'

    tonViewerMainnet = 'https://tonviewer.com/transaction/'

    tonViewerTestnet = 'https://testnet.tonviewer.com/transaction/'

    tonScanMainnet = 'https://tonscan.org/tx/'

    tonScanTestnet = 'https://testnet.tonscan.org/tx/'

    explorerUrl: string

    workchain: number

    net: Network

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

            if (url) {
                const response = await axios.get(url)

                if (response.status !== 200) {
                    return new Error(response.statusText + ': ' + JSON.stringify(response.data))
                }
            }

            return true
        } catch (error) {
            console.log(error)
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

        this.net = testnet ? Network.TESTNET : Network.MAINNET

        Provider._instance = this
    }

    /**
     * Get the current network configuration is testnet or not
     * @returns testnet status
     */
    isTestnet(): boolean {
        return this.network?.testnet ?? false
    }

    /**
     * Get the current network configuration is mainnet or not
     * @param address - Wallet address
     * @returns wallet version
     */
    async findWalletVersion(address: string): Promise<WalletVersion> {
        const result = await this.client3.getWalletInformation(address)
        if (result.status === 'uninitialized') {
            throw new Error('Wallet is not initialized')
        }

        const type = result.wallet_type

        switch (type) {
            case 'wallet v5 r1':
                return WalletVersion.V5R1
            case 'wallet v5 beta':
                return WalletVersion.V5_BETA
            case 'wallet v4 r2':
                return WalletVersion.V4R2
            case 'wallet v4 r1':
                return WalletVersion.V4R1
            case 'wallet v3 r2':
                return WalletVersion.V3R2
            case 'wallet v3 r1':
                return WalletVersion.V3R1
            default:
                throw new Error('Unknown wallet version')
        }
    }

    /**
     * Get the current network configuration is mainnet or not
     * @param publicKey - Public key of the wallet
     * @param version - Wallet contract version
     * @returns mainnet status
     */
    createWalletByVersion(publicKey: Buffer, version: WalletVersion): WalletContract {
        const workchain = this.workchain

        switch (version) {
            case WalletVersion.V3R1:
                return WalletContractV3R1.create({ workchain, publicKey })
            case WalletVersion.V3R2:
                return WalletContractV3R2.create({ workchain, publicKey })
            case WalletVersion.V4R1:
                throw new Error('Unsupported wallet contract version - v4R1')
            case WalletVersion.V4R2:
                return WalletContractV4.create({ workchain, publicKey })
            case WalletVersion.V5_BETA:
                return WalletContractV5Beta.create({
                    walletId: {
                        networkGlobalId: this.net
                    },
                    publicKey
                })
            case WalletVersion.V5R1:
                return this.createWalletV5R1(publicKey)
        }
    }

    /**
     * Create wallet contract for version 5R1
     * @param publicKey - Public key of the wallet
     * @returns Wallet contract
     */
    createWalletV5R1(publicKey: Buffer): WalletContractV5R1 {
        return WalletContractV5R1.create({
            workchain: this.workchain,
            walletId: {
                networkGlobalId: this.net
            },
            publicKey
        })
    }

    /**
     * Retry the function
     * @param fn - Function that will be retried
     * @param options - Retry options
     * @param options.retries - Number of retries
     * @param options.delay - Delay between retries
     * @returns Function result
     */
    async retry<T>(fn: () => Promise<T>, options: { retries: number; delay: number }): Promise<T> {
        let lastError: Error | undefined
        for (let i = 0; i < options.retries; i++) {
            try {
                return await fn()
            } catch (e) {
                if (e instanceof Error) {
                    lastError = e
                }
                await new Promise((resolve) => setTimeout(resolve, options.delay))
            }
        }
        throw lastError ?? new Error('Unknown error')
    }

    /**
     * Find transaction hash by message hash=
     * @param _hash - Message hash
     * @returns Transaction hash
     */
    async findTxHashByBodyHash(_hash: string): Promise<string> {
        return await this.retry(
            async () => {
                const { messages } = await this.client3.getMessages({
                    body_hash: _hash
                })
                if (messages[0]) {
                    return Buffer.from(messages[0].in_msg_tx_hash, 'base64').toString('hex')
                } else {
                    throw new Error('Transaction not found')
                }
            },
            { retries: 30, delay: 1000 }
        )
    }

    /**
     * Find transaction hash by message hash
     * @param _hash - Message hash
     * @returns Transaction hash
     */
    async findTxHashByMessageHash(_hash: string): Promise<string> {
        return await this.retry(
            async () => {
                const { messages } = await this.client3.getMessages({
                    msg_hash: [_hash]
                })
                if (messages[0]) {
                    return Buffer.from(messages[0].in_msg_tx_hash, 'base64').toString('hex')
                } else {
                    throw new Error('Transaction not found')
                }
            },
            { retries: 30, delay: 1000 }
        )
    }
}
