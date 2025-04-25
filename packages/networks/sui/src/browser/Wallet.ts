import { Provider } from '../services/Provider'
import type { Transaction } from '@mysten/sui/transactions'
import type { TransactionSigner } from '../services/TransactionSigner'
import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    type TransactionId,
    type SignedMessage,
    type WalletAddress,
    type ConnectConfig,
    type UnknownConfig,
    ErrorTypeEnum
} from '@multiplechain/types'

export interface WalletProvider {
    getAddress: () => Promise<string>
    signMessage: (message: string) => Promise<string>
    sendTransaction: (transaction: Transaction) => Promise<string>
    on: (event: string, callback: (data: any) => void) => void
}

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain Sui Wallet Error:', error)

    const errorMessage = String(error.message ?? '')

    console.log('Error message:', errorMessage)

    return reject(error)
}

type WalletAdapter = WalletAdapterInterface<Provider, WalletProvider>

export class Wallet implements WalletInterface<Provider, WalletProvider, TransactionSigner> {
    /**
     * WalletAdapter instance
     */
    adapter: WalletAdapter

    /**
     * Wallet provider is the instance of the wallet connection
     */
    walletProvider: WalletProvider

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
        return await new Promise((resolve, reject) => {
            this.adapter
                .connect(this.networkProvider, config)
                .then(async (provider) => {
                    this.walletProvider = provider
                    resolve(await this.getAddress())
                })
                .catch((error) => {
                    rejectMap(error, (error: any): void => {
                        if (error.message === ErrorTypeEnum.WALLET_REQUEST_REJECTED) {
                            reject(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
                        } else {
                            reject(error)
                        }
                    })
                })
        })
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
        return await this.walletProvider.getAddress()
    }

    /**
     * @param message - Message to sign
     * @returns signed message
     */
    async signMessage(message: string): Promise<SignedMessage> {
        return await new Promise((resolve, reject) => {
            this.walletProvider
                .signMessage(message)
                .then((signature) => {
                    resolve(signature)
                })
                .catch((error) => {
                    rejectMap(error, reject)
                })
        })
    }

    /**
     * @param transactionSigner - Transaction signer
     * @returns transaction id
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        return await new Promise((resolve, reject) => {
            this.walletProvider
                .sendTransaction(transactionSigner.getRawData())
                .then((txHash) => {
                    resolve(txHash)
                })
                .catch((error) => {
                    rejectMap(error, reject)
                })
        })
    }

    /**
     * @param eventName - Event name
     * @param callback - Event callback
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        this.walletProvider.on(eventName, callback)
    }
}
