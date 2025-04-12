import type { Provider } from '../../services/Provider'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { ConnectConfig, UnknownConfig, WalletAdapterInterface } from '@multiplechain/types'

declare global {
    interface Window {
        example: any
    }
}

const Example: WalletAdapterInterface<Provider, unknown> = {
    id: 'example',
    name: 'Example',
    icon: 'icon base64 string here',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'wallet download link here',
    createDeepLink(url: string, config?: UnknownConfig): string {
        return `https://example.com/dapp/${url}`
    },
    isDetected: () => Boolean(window?.example),
    isConnected: async () => {
        return true // return true if connected
    },
    connect: async (provider?: Provider, config?: ConnectConfig) => {
        // connect wallet here
        return window.example
    }
}

export default Example
