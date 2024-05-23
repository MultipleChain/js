import {
    type WalletInterface,
    type WalletPlatformEnum,
    type WalletAdapterInterface,
    ErrorTypeEnum,
    type ConnectConfig,
    type UnknownConfig,
    type WalletAddress,
    type SignedMessage,
    type TransactionId
} from '@multiplechain/types'
import { Provider } from '../services/Provider.ts'
import type {
    BaseMessageSignerWalletAdapter,
    WalletAdapterEvents
} from '@solana/wallet-adapter-base'
import { base58Encode } from '@multiplechain/utils'
import type { TransactionSigner } from '../services/TransactionSigner.ts'

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain Solana Wallet Error:', error)

    const errorMessage = String(error.message ?? '')

    if (typeof error === 'object') {
        if (errorMessage.includes('QR Code Modal Closed')) {
            return reject(new Error(ErrorTypeEnum.CLOSED_WALLETCONNECT_MODAL))
        }

        if (error.name === 'WalletSendTransactionError') {
            if (
                errorMessage.includes('Unexpected error') ||
                errorMessage.includes('Transaction simulation failed: Blockhash not found') ||
                errorMessage.includes(
                    'Transaction results in an account (1) without insufficient funds for rent'
                )
            ) {
                return reject(error)
            }
        }

        if (
            [
                'WalletConnectionError',
                'WalletWindowClosedError',
                'WalletAccountError',
                'WalletSendTransactionError',
                'WalletSignMessageError'
            ].includes(String(error.name)) ||
            error.code === 4001 ||
            errorMessage === 'User rejected the request.' ||
            error.name === 'WalletSignTransactionError' ||
            errorMessage.includes('user reject this request') ||
            errorMessage.includes('Transaction rejected') ||
            errorMessage === 'User canceled request'
        ) {
            return reject(new Error(ErrorTypeEnum.WALLET_REQUEST_REJECTED))
        } else if (error.name === 'WalletTimeoutError') {
            return reject(new Error(ErrorTypeEnum.WALLET_CONNECTION_TIMEOUT))
        } else if (
            (errorMessage.length > 0 && errorMessage.includes('403')) ||
            (errorMessage.length > 0 && errorMessage.includes('Access forbidden'))
        ) {
            return reject(new Error(ErrorTypeEnum.RPC_ACCESS_DENIED))
        } else if (error.name === 'WalletNotReadyError') {
            return reject(new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED))
        } else if (
            (error.name === 'WalletSendTransactionError' &&
                errorMessage !== 'User rejected the request') ||
            errorMessage === 'User disapproved requested chains'
        ) {
            return reject(new Error(ErrorTypeEnum.UNACCEPTED_CHAIN))
        }
    }

    return reject(error)
}

export type WalletAdapter = BaseMessageSignerWalletAdapter

type WalletAdapterType = WalletAdapterInterface<Provider, WalletAdapter>

export class Wallet implements WalletInterface<Provider, WalletAdapter, TransactionSigner> {
    adapter: WalletAdapterType

    walletProvider: WalletAdapter

    networkProvider: Provider

    currentReject: (a: any) => any

    /**
     * @param {WalletAdapterType} adapter
     * @param {Provider} provider
     */
    constructor(adapter: WalletAdapterType, provider?: Provider) {
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
            this.currentReject = reject
            this.adapter
                .connect(this.networkProvider, config)
                .then(async (provider) => {
                    this.walletProvider = provider as BaseMessageSignerWalletAdapter
                    this.on('error', (error) => rejectMap(error, this.currentReject))
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
        return this.walletProvider.publicKey?.toBase58() ?? ''
    }

    /**
     * @param {string} message
     * @returns {Promise<SignedMessage>}
     */
    async signMessage(message: string): Promise<SignedMessage> {
        return await new Promise((resolve, reject) => {
            this.currentReject = reject
            this.walletProvider
                .signMessage(Buffer.from(message, 'utf8'))
                .then((signature: Uint8Array) => {
                    resolve(base58Encode(signature))
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
        return await new Promise((resolve, reject) => {
            this.currentReject = reject
            try {
                void (async () => {
                    resolve(
                        await this.walletProvider.sendTransaction(
                            transactionSigner.getRawData(),
                            this.networkProvider.web3
                        )
                    )
                })()
            } catch (error) {
                rejectMap(error, reject)
            }
        })
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        this.walletProvider.on(eventName as keyof WalletAdapterEvents, callback)
    }
}
