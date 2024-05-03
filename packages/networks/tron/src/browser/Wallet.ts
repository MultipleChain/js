import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    type TransactionSignerInterface,
    ErrorTypeEnum,
    type ProviderInterface
} from '@multiplechain/types'
import { Provider } from '../services/Provider.ts'
import type { Adapter, AdapterEvents, Transaction } from '@tronweb3/tronwallet-abstract-adapter'

export interface CustomAdapter extends Adapter {
    network?: () => Promise<any>
}

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain Tron Wallet Error:', error)

    const errorMessage = String(error.message ?? '')

    if (error === 'Cannot transfer TRX to the same account') {
        return reject(new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED))
    }

    if (typeof error === 'object') {
        if (
            error.name === 'WalletSignTransactionError' ||
            errorMessage.includes('Confirmation declined by user') ||
            errorMessage.includes('User rejected the request.') ||
            errorMessage.includes('The user rejected connection.') ||
            errorMessage.includes('Modal is closed.') ||
            errorMessage.includes('User canceled') ||
            errorMessage.includes('User rejected')
        ) {
            return reject(new Error(ErrorTypeEnum.WALLET_REQUEST_REJECTED))
        } else if (errorMessage.includes('The wallet is not found.')) {
            return reject(new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED))
        } else if (errorMessage.includes('User disapproved requested chains')) {
            return reject(new Error(ErrorTypeEnum.UNACCEPTED_CHAIN))
        } else if (errorMessage.includes('The QR window is closed.')) {
            return reject(new Error(ErrorTypeEnum.CLOSED_WALLETCONNECT_MODAL))
        }
    }

    return reject(error)
}

export class Wallet implements WalletInterface {
    adapter: WalletAdapterInterface

    walletProvider: CustomAdapter

    networkProvider: Provider

    /**
     * @param {WalletAdapterInterface} adapter
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
     * @returns {string | undefined}
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
                    this.walletProvider = provider as CustomAdapter

                    if (
                        this.walletProvider.network !== undefined &&
                        this.networkProvider.node.id !==
                            (await this.walletProvider.network()).chainId
                    ) {
                        reject(ErrorTypeEnum.UNACCEPTED_CHAIN)
                        return
                    }

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
    async getChainId(): Promise<string> {
        return this.networkProvider.node.id
    }

    /**
     * @returns {Promise<string>}
     */
    async getAddress(): Promise<string> {
        return this.walletProvider.address ?? ''
    }

    /**
     * @param {string} message
     */
    async signMessage(message: string): Promise<string> {
        return await new Promise((resolve, reject) => {
            this.walletProvider
                .signMessage(message)
                .then((signature: string) => {
                    resolve(signature)
                })
                .catch((error: any) => {
                    reject(error)
                })
        })
    }

    /**
     * @param {TransactionSignerInterface} transactionSigner
     * @returns {Promise<string>}
     */
    async sendTransaction(transactionSigner: TransactionSignerInterface): Promise<string> {
        const signedTx = await this.walletProvider.signTransaction(
            transactionSigner.getRawData() as Transaction
        )
        const { transaction } = await this.networkProvider.tronWeb.trx.sendRawTransaction(signedTx)
        if (transaction === undefined) throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        return transaction.txID as string
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        if (this.adapter?.provider?.on !== undefined) {
            this.adapter.provider.on(eventName, callback)
        } else {
            this.walletProvider.on(eventName as keyof AdapterEvents, callback)
        }
    }
}
