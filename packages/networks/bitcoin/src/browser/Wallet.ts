import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    ErrorTypeEnum,
    type UnknownConfig,
    type ConnectConfig,
    type WalletAddress,
    type SignedMessage,
    type TransactionId
} from '@multiplechain/types'
import { Provider } from '../services/Provider.ts'
import type { TransactionSigner } from '../services/TransactionSigner.ts'

export interface WalletProvider {
    getAddress: () => Promise<string>
    signMessage: (message: string) => Promise<string>
    sendBitcoin: (to: string, amount: number) => Promise<string>
    on: (event: string, callback: (data: any) => void) => void
}

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain Bitcoin Wallet Error:', error)

    if (typeof error === 'object') {
        if (error.code === 4001 || String(error.message).includes('User rejected the request')) {
            return reject(ErrorTypeEnum.WALLET_REQUEST_REJECTED)
        } else if (String(error).includes('is not valid JSON')) {
            return reject(ErrorTypeEnum.UNACCEPTED_CHAIN)
        }
    }

    return reject(error)
}

type WalletAdapter = WalletAdapterInterface<Provider, WalletProvider>

export class Wallet implements WalletInterface<Provider, WalletProvider, TransactionSigner> {
    adapter: WalletAdapter

    walletProvider: WalletProvider

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
        return await new Promise((resolve, reject) => {
            this.adapter
                .connect(this.networkProvider, config)
                .then(async (provider) => {
                    this.walletProvider = provider
                    resolve(await this.getAddress())
                })
                .catch((error) => {
                    const customReject = (error: any): void => {
                        if (error.message === ErrorTypeEnum.WALLET_REQUEST_REJECTED) {
                            reject(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
                        } else {
                            reject(error)
                        }
                    }
                    rejectMap(error, customReject)
                })
        })
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
        return await this.walletProvider.getAddress()
    }

    /**
     * @param {string} message
     * @returns {Promise<SignedMessage>}
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
     * @param {TransactionSigner} transactionSigner
     * @returns {Promise<TransactionId>}
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        const data = transactionSigner.getRawData()
        return await new Promise((resolve, reject) => {
            this.walletProvider
                .sendBitcoin(data.receiver, data.amount)
                .then((txHash) => {
                    resolve(txHash)
                })
                .catch((error) => {
                    rejectMap(error, reject)
                })
        })
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        this.walletProvider.on(eventName, callback)
    }
}
