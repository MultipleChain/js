import { Provider } from '../services/Provider.ts'
import type { TransactionSigner } from '../services/TransactionSigner.ts'
import type {
    WalletInterface,
    WalletAdapterInterface,
    WalletPlatformEnum,
    TransactionId,
    SignedMessage,
    WalletAddress,
    ConnectConfig,
    UnknownConfig
} from '@multiplechain/types'

type WalletAdapter = WalletAdapterInterface<Provider, unknown>

export class Wallet implements WalletInterface<Provider, unknown, TransactionSigner> {
    /**
     * WalletAdapter instance
     */
    adapter: WalletAdapter

    /**
     * Wallet provider is the instance of the wallet connection
     */
    walletProvider: unknown

    /**
     * Network provider is the instance of the blockchain network connection
     */
    networkProvider: Provider

    /**
     * @param {WalletAdapter} adapter
     * @param {Provider} provider
     */
    constructor(adapter: WalletAdapter, provider?: Provider) {
        this.adapter = adapter
        this.networkProvider = provider ?? Provider.instance
    }

    /**
     * @returns {string}
     */
    getId(): string {
        return this.adapter.id
    }

    /**
     * @returns {string}
     */
    getName(): string {
        return this.adapter.name
    }

    /**
     * @returns {string}
     */
    getIcon(): string {
        return this.adapter.icon
    }

    /**
     * @returns {WalletPlatformEnum[]}
     */
    getPlatforms(): WalletPlatformEnum[] {
        return this.adapter.platforms
    }

    /**
     * @returns {string}
     */
    getDownloadLink(): string | undefined {
        return this.adapter.downloadLink
    }

    /**
     * @param {string} url
     * @param {UnknownConfig} config
     * @returns {string}
     */
    createDeepLink(url: string, config?: UnknownConfig): string | null {
        if (this.adapter.createDeepLink === undefined) {
            return null
        }

        return this.adapter.createDeepLink(url, config)
    }

    /**
     * @param {ConnectConfig} config
     * @returns {Promise<WalletAddress>}
     */
    async connect(config?: ConnectConfig): Promise<WalletAddress> {
        await this.adapter.connect()
        return 'wallet address'
    }

    /**
     * @returns {boolean}
     */
    async isDetected(): Promise<boolean> {
        return await this.adapter.isDetected()
    }

    /**
     * @returns {boolean}
     */
    async isConnected(): Promise<boolean> {
        return await this.adapter.isConnected()
    }

    /**
     * @returns {Promise<WalletAddress>}
     */
    async getAddress(): Promise<WalletAddress> {
        return 'wallet address'
    }

    /**
     * @param {string} message
     * @returns {Promise<SignedMessage>}
     */
    async signMessage(message: string): Promise<SignedMessage> {
        return 'signed message'
    }

    /**
     * @param {TransactionSigner} transactionSigner
     * @returns {Promise<TransactionId>}
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        return 'transaction hash'
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        'wallet events'
    }
}
