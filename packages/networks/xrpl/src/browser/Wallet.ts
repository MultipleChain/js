import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    type UnknownConfig,
    type ConnectConfig,
    type WalletAddress,
    type SignedMessage,
    type TransactionId,
    ErrorTypeEnum
} from '@multiplechain/types'
import { Provider } from '../services/Provider'
import type { TransactionSigner } from '../services/TransactionSigner'

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain XRPl Wallet Error:', error)

    const errorMessage = String(error.message ?? '')

    if (errorMessage.includes('User rejected the request')) {
        return reject(new Error(ErrorTypeEnum.WALLET_REQUEST_REJECTED))
    }

    if (errorMessage.includes('Error calling submit')) {
        return reject(new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED))
    }

    return reject(error)
}

export interface WalletProvider {
    getAddress: () => Promise<string>
    signMessage: (message: string) => Promise<string>
    sendXrp: (to: string, amount: string) => Promise<string>
    on: (event: string, callback: (data: any) => void) => void
}

type WalletAdapter = WalletAdapterInterface<Provider, any>

export class Wallet implements WalletInterface<Provider, WalletProvider, TransactionSigner> {
    adapter: WalletAdapter

    walletProvider: WalletProvider

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
     * @returns wallet detection status
     */
    async isDetected(): Promise<boolean> {
        return await this.adapter.isDetected()
    }

    /**
     * @returns connection status
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
     * @param message message to sign
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
     * @param transactionSigner transaction signer
     * @returns transaction id
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        const data = transactionSigner.getRawData()
        return await new Promise((resolve, reject) => {
            if (!data.Destination || !data.Amount) {
                throw new Error('Invalid transaction data')
            }
            this.walletProvider
                .sendXrp(data.Destination, data.Amount)
                .then((txHash) => {
                    resolve(txHash)
                })
                .catch((error) => {
                    rejectMap(error, reject)
                })
        })
    }

    /**
     * @param eventName event name
     * @param callback event callback
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        this.walletProvider.on(eventName, callback)
    }
}
