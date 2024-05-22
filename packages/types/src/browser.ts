import type { WalletPlatformEnum } from './enums.ts'

export type RegisterWalletAdapterType<NetworkProvider, WalletProvider> = (
    walletAdapter: WalletAdapterInterface<NetworkProvider, WalletProvider>
) => void

export type WalletAdapterListType<NetworkProvider, WalletProvider> = Record<
    string,
    WalletAdapterInterface<NetworkProvider, WalletProvider>
>

export interface WalletConnectConfig {
    projectId: string
    themeMode?: 'dark' | 'light'
}

export type UnknownConfig = Record<string, unknown>

export type ConnectConfig = UnknownConfig & WalletConnectConfig

export interface WalletAdapterInterface<NetworkProvider, WalletProvider> {
    id: string
    name: string
    icon: string
    provider?: unknown
    downloadLink?: string
    platforms: WalletPlatformEnum[]
    disconnect?: () => void | Promise<void>
    isDetected: () => boolean | Promise<boolean>
    isConnected: () => boolean | Promise<boolean>
    createDeepLink?: (url: string, config?: UnknownConfig) => string
    connect: (provider?: NetworkProvider, config?: ConnectConfig) => Promise<WalletProvider>
}

export interface WalletInterface<NetworkProvider, WalletProvider, TransactionSigner> {
    adapter: WalletAdapterInterface<NetworkProvider, WalletProvider>

    walletProvider: WalletProvider

    networkProvider: NetworkProvider

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
     * @param {UnknownConfig} config
     * @returns {String | null}
     */
    createDeepLink: (url: string, config?: UnknownConfig) => string | null

    /**
     * @param {ConnectConfig} config
     * @returns {Promise<string>}
     */
    connect: (config?: ConnectConfig) => Promise<string>

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
     * @param {Signer} transactionSigner
     * @returns {Promise<string>}
     */
    sendTransaction: (transactionSigner: TransactionSigner) => Promise<string>

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on: (eventName: string, callback: (...args: unknown[]) => void) => void
}
