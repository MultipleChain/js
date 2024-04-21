import type { WalletPlatformEnum } from './enums.ts'
import type { ProviderInterface } from './services/ProviderInterface.ts'
import type { TransactionSignerInterface } from './services/TransactionSignerInterface.ts'

export type RegisterWalletAdapterType = (walletAdapter: WalletAdapterInterface) => void

export type WalletAdapterListType = Record<string, WalletAdapterInterface>

export interface WalletAdapterInterface {
    id: string
    name: string
    icon: string
    provider: any
    downloadLink?: string
    platforms: WalletPlatformEnum[]
    isDetected: () => boolean | Promise<boolean>
    isConnected: () => boolean | Promise<boolean>
    createDeepLink?: (url: string, ops?: object) => string
    connect: (provider?: ProviderInterface, ops?: object) => Promise<object>
}

export interface WalletConnectOps {
    projectId: string
    themeMode?: 'dark' | 'light'
}

export interface WalletConnectAdapterInterface
    extends Omit<WalletAdapterInterface, 'connect' | 'provider'> {
    connect: (provider: ProviderInterface, ops: WalletConnectOps) => Promise<object>
    disconnect?: () => void
}

export interface WalletInterface {
    adapter: WalletAdapterInterface | WalletConnectAdapterInterface

    /**
     * @returns {String}
     */
    getId: () => string

    /**
     * @returns {String}
     */
    getName: () => string

    /**
     * @returns {String}
     */
    getIcon: () => string

    /**
     * @returns {WalletPlatformEnum[]}
     */
    getPlatforms: () => WalletPlatformEnum[]

    /**
     * @returns {String}
     */
    getDownloadLink: () => string

    /**
     * @param {String} url
     * @param {Object} ops
     * @returns {String}
     */
    createDeepLink: (url: string, ops?: object) => string

    /**
     * @returns {Promise<string>}
     */
    connect: () => Promise<string>

    /**
     * @returns {Boolean}
     */
    isDetected: () => boolean

    /**
     * @returns {Boolean}
     */
    isConnected: () => boolean

    /**
     * @returns {Promise<string>}
     */
    getAddress: () => Promise<string>

    /**
     * @param {string} message
     * @returns {Promise<string>}
     */
    signMessage: (message: string) => Promise<string>

    /**
     * @param {TransactionSignerInterface} transactionSigner
     * @returns {Promise<string>}
     */
    sendTransaction: (transactionSigner: TransactionSignerInterface) => Promise<string>

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on: (eventName: string, callback: (...args: any[]) => void) => void
}
