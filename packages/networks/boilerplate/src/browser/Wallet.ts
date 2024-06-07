import { Provider } from '../services/Provider'
import type { TransactionSigner } from '../services/TransactionSigner'
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
     * @param adapter - WalletAdapter instance
     * @param provider - Network provider
     */
    constructor(adapter: WalletAdapter, provider?: Provider) {
        this.adapter = adapter
        this.networkProvider = provider ?? Provider.instance
    }

    /**
     * @returns wallet id
     */
    getId(): string {
        return this.adapter.id
    }

    /**
     * @returns wallet name
     */
    getName(): string {
        return this.adapter.name
    }

    /**
     * @returns wallet icon
     */
    getIcon(): string {
        return this.adapter.icon
    }

    /**
     * @returns wallet platforms
     */
    getPlatforms(): WalletPlatformEnum[] {
        return this.adapter.platforms
    }

    /**
     * @returns wallet download link
     */
    getDownloadLink(): string | undefined {
        return this.adapter.downloadLink
    }

    /**
     * @param url - URL to create a deep link
     * @param config - Configuration for the deep link
     * @returns deep link
     */
    createDeepLink(url: string, config?: UnknownConfig): string | null {
        if (this.adapter.createDeepLink === undefined) {
            return null
        }

        return this.adapter.createDeepLink(url, config)
    }

    /**
     * @param config - Configuration for the connection
     * @returns wallet address
     */
    async connect(config?: ConnectConfig): Promise<WalletAddress> {
        await this.adapter.connect()
        return 'wallet address'
    }

    /**
     * @returns wallet detected status
     */
    async isDetected(): Promise<boolean> {
        return await this.adapter.isDetected()
    }

    /**
     * @returns wallet connected status
     */
    async isConnected(): Promise<boolean> {
        return await this.adapter.isConnected()
    }

    /**
     * @returns wallet address
     */
    async getAddress(): Promise<WalletAddress> {
        return 'wallet address'
    }

    /**
     * @param message - Message to sign
     * @returns signed message
     */
    async signMessage(message: string): Promise<SignedMessage> {
        return 'signed message'
    }

    /**
     * @param transactionSigner - Transaction signer
     * @returns transaction id
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        return 'transaction hash'
    }

    /**
     * @param eventName - Event name
     * @param callback - Event callback
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        'wallet events'
    }
}
