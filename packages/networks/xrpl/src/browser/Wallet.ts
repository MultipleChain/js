import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    type UnknownConfig,
    type ConnectConfig,
    type WalletAddress,
    type SignedMessage,
    type TransactionId
} from '@multiplechain/types'
import { Provider } from '../services/Provider'
import type { TransactionSigner } from '../services/TransactionSigner'

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain XRPl Wallet Error:', error)

    return reject(error)
}

type WalletAdapter = WalletAdapterInterface<Provider, any>

export class Wallet implements WalletInterface<Provider, any, TransactionSigner> {
    adapter: WalletAdapter

    walletProvider: any

    networkProvider: Provider

    /**
     * @param adapter - Wallet adapter
     * @param provider - Network provider
     */
    constructor(adapter: WalletAdapter, provider?: Provider) {
        this.adapter = adapter
        this.networkProvider = provider ?? Provider.instance
    }

    /**
     * @returns Wallet ID
     */
    getId(): string {
        return this.adapter.id
    }

    /**
     * @returns Wallet name
     */
    getName(): string {
        return this.adapter.name
    }

    /**
     * @returns Wallet icon
     */
    getIcon(): string {
        return this.adapter.icon
    }

    /**
     * @returns Wallet platforms
     */
    getPlatforms(): WalletPlatformEnum[] {
        return this.adapter.platforms
    }

    /**
     * @returns Wallet download link
     */
    getDownloadLink(): string | undefined {
        return this.adapter.downloadLink
    }

    /**
     * @param url url for deep linking
     * @param config configuration for deep linking
     * @returns deep link
     */
    createDeepLink(url: string, config?: UnknownConfig): string | null {
        if (this.adapter.createDeepLink === undefined) {
            return null
        }

        return this.adapter.createDeepLink(url, config)
    }

    /**
     * @param config connection configuration
     * @returns WalletAddress
     */
    async connect(config?: ConnectConfig): Promise<WalletAddress> {
        return await new Promise((resolve, reject) => {})
    }

    /**
     * @returns wallet detection status
     */
    async isDetected(): Promise<boolean> {
        return this.adapter.isDetected()
    }

    /**
     * @returns connection status
     */
    async isConnected(): Promise<boolean> {
        return this.adapter.isConnected()
    }

    /**
     * @returns wallet address
     */
    async getAddress(): Promise<WalletAddress> {
        return this.walletProvider.getAddress()
    }

    /**
     * @param message message to sign
     * @returns signed message
     */
    async signMessage(message: string): Promise<SignedMessage> {
        return await new Promise((resolve, reject) => {})
    }

    /**
     * @param transactionSigner transaction signer
     * @returns transaction id
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        return await new Promise((resolve, reject) => {})
    }

    /**
     * @param eventName event name
     * @param callback event callback
     */
    on(eventName: string, callback: (...args: any[]) => void): void {}
}
