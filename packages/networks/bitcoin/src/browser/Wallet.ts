import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    type TransactionSignerInterface,
    type ProviderInterface,
    ErrorTypeEnum
} from '@multiplechain/types'
import { Provider } from '../services/Provider.ts'
import type { TransactionData } from '../services/TransactionSigner.ts'

export interface BitcoinWalletAdapter {
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

export class Wallet implements WalletInterface {
    adapter: WalletAdapterInterface

    walletProvider: BitcoinWalletAdapter

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
        return await new Promise((resolve, reject) => {
            this.adapter
                .connect(provider, ops)
                .then(async (provider) => {
                    this.walletProvider = provider as BitcoinWalletAdapter
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
     * @returns {Promise<string>}
     */
    async getAddress(): Promise<string> {
        return await this.walletProvider.getAddress()
    }

    /**
     * @param {string} message
     */
    async signMessage(message: string): Promise<string> {
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
     * @param {TransactionSignerInterface} transactionSigner
     * @returns {Promise<string>}
     */
    async sendTransaction(transactionSigner: TransactionSignerInterface): Promise<string> {
        const data = (await transactionSigner.getRawData()) as TransactionData
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
