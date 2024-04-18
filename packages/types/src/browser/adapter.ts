import type { WalletPlatformEnum } from '../enums.ts'
import type { ProviderInterface } from '../services/ProviderInterface.ts'

export type RegisterWalletAdapter = (walletAdapter: WalletAdapter) => void

export type WalletAdapterList = Record<string, WalletAdapter>

export interface WalletAdapter {
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
