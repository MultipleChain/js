import type { WalletPlatformEnum } from './enums.ts'
import type { ProviderInterface } from './services/ProviderInterface.ts'
import type { TransactionSignerInterface } from './services/TransactionSignerInterface.ts'

export type RegisterWalletAdapterType = (walletAdapter: WalletAdapterInterface) => void

export type WalletAdapterListType = Record<string, WalletAdapterInterface>

export interface WalletConnectOps {
    projectId: string
    themeMode?: 'dark' | 'light'
}

export interface WalletAdapterInterface {
    id: string
    name: string
    icon: string
    provider?: any
    downloadLink?: string
    platforms: WalletPlatformEnum[]
    disconnect?: () => void | Promise<void>
    isDetected: () => boolean | Promise<boolean>
    isConnected: () => boolean | Promise<boolean>
    createDeepLink?: (url: string, ops?: object) => string
    connect: (provider?: ProviderInterface, ops?: object | WalletConnectOps) => Promise<object>
}

export interface WalletInterface {
    adapter: WalletAdapterInterface

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
     * @returns {String | undefined}
     */
    getDownloadLink: () => string | undefined

    /**
     * @param {String} url
     * @param {Object} ops
     * @returns {String | null}
     */
    createDeepLink: (url: string, ops?: object) => string | null

    /**
     * @param {ProviderInterface} provider
     * @param {Object | WalletConnectOps} ops
     * @returns {Promise<string>}
     */
    connect: (provider?: ProviderInterface, ops?: object | WalletConnectOps) => Promise<string>

    /**
     * @returns {Boolean | Promise<Boolean>}
     */
    isDetected: () => boolean | Promise<boolean>

    /**
     * @returns {Boolean | Promise<Boolean>}
     */
    isConnected: () => boolean | Promise<boolean>

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
