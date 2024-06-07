import type { WalletPlatformEnum } from './enums'
import type { SignedMessage, TransactionId, WalletAddress } from './defines'

// WalletAdapter registration function for WalletInterface
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

// This is WalletAdapter definition for using in WalletInterface
export interface WalletAdapterInterface<NetworkProvider, WalletProvider> {
    id: string
    name: string
    icon: string
    downloadLink?: string
    provider?: WalletProvider
    platforms: WalletPlatformEnum[]
    disconnect?: () => void | Promise<void>
    isDetected: () => boolean | Promise<boolean>
    isConnected: () => boolean | Promise<boolean>
    createDeepLink?: (url: string, config?: UnknownConfig) => string
    connect: (provider?: NetworkProvider, config?: ConnectConfig) => Promise<WalletProvider>
}

// For signing generated transactions with wallets and for wallet connection processes.
export interface WalletInterface<NetworkProvider, WalletProvider, TransactionSigner> {
    /**
     * WalletAdapter instance
     */
    adapter: WalletAdapterInterface<NetworkProvider, WalletProvider>

    /**
     * Wallet provider is the instance of the wallet connection
     */
    walletProvider: WalletProvider

    /**
     * Network provider is the instance of the blockchain network connection
     */
    networkProvider: NetworkProvider

    /**
     * @returns {string}
     */
    getId: () => string

    /**
     * @returns {string}
     */
    getName: () => string

    /**
     * @returns {string}
     */
    getIcon: () => string

    /**
     * @returns {WalletPlatformEnum[]}
     */
    getPlatforms: () => WalletPlatformEnum[]

    /**
     * @returns {string | undefined}
     */
    getDownloadLink: () => string | undefined

    /**
     * @param {string} url
     * @param {UnknownConfig} config
     * @returns {string | null}
     */
    createDeepLink: (url: string, config?: UnknownConfig) => string | null

    /**
     * @param {ConnectConfig} config
     * @returns {Promise<WalletAddress>}
     */
    connect: (config?: ConnectConfig) => Promise<WalletAddress>

    /**
     * @returns {boolean | Promise<boolean>}
     */
    isDetected: () => boolean | Promise<boolean>

    /**
     * @returns {boolean | Promise<boolean>}
     */
    isConnected: () => boolean | Promise<boolean>

    /**
     * @returns {Promise<WalletAddress>}
     */
    getAddress: () => Promise<WalletAddress>

    /**
     * @param {string} message
     * @returns {Promise<SignedMessage>}
     */
    signMessage: (message: string) => Promise<SignedMessage>

    /**
     * @param {TransactionSigner} transactionSigner
     * @returns {Promise<TransactionId>}
     */
    sendTransaction: (transactionSigner: TransactionSigner) => Promise<TransactionId>

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on: (eventName: string, callback: (...args: unknown[]) => void) => void
}
