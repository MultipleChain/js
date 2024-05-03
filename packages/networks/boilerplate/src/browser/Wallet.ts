import type {
    WalletInterface,
    WalletAdapterInterface,
    WalletPlatformEnum,
    TransactionSignerInterface,
    ProviderInterface
} from '@multiplechain/types'
import { Provider } from '../services/Provider'

export class Wallet implements WalletInterface {
    adapter: WalletAdapterInterface

    walletProvider: object

    networkProvider: Provider

    /**
     * @param {WalletAdapterInterface} adapter
     * @param {Provider} provider
     */
    constructor(adapter: WalletAdapterInterface, provider?: Provider) {
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
     * @param {object} ops
     * @returns {string}
     */
    createDeepLink(url: string, ops?: object): string | null {
        if (this.adapter.createDeepLink === undefined) {
            return null
        }

        return this.adapter.createDeepLink(url, ops)
    }

    /**
     * @param {ProviderInterface} provider
     * @param {Object} ops
     * @returns {Promise<string>}
     */
    async connect(provider?: ProviderInterface, ops?: object): Promise<string> {
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
     * @returns {Promise<string>}
     */
    async getAddress(): Promise<string> {
        return 'wallet address'
    }

    /**
     * @param {string} message
     */
    async signMessage(message: string): Promise<string> {
        return 'signed message'
    }

    /**
     * @param {TransactionSignerInterface} transactionSigner
     * @returns {Promise<string>}
     */
    async sendTransaction(transactionSigner: TransactionSignerInterface): Promise<string> {
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
