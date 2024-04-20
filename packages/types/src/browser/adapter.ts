import type { WalletPlatformEnum } from '../enums.ts'
import type { ProviderInterface } from '../services/ProviderInterface.ts'

export type RegisterWalletAdapterType = (walletAdapter: WalletAdapterInterface) => void

export type WalletAdapterListType = Record<string, WalletAdapterInterface>

export interface WalletAdapterInterface {
    id: string
    name: string
    icon: string
    downloadLink: string
    platforms: WalletPlatformEnum[]
    isDetected: () => boolean
    isConnected: () => boolean
    createDeepLink: (url: string, ops?: object) => string
    connect: (provider?: ProviderInterface, ops?: object) => Promise<object>
}
