import { WalletPlatformEnum } from '@multiplechain/types'
import type { WalletAdapterInterface } from '@multiplechain/types'

declare global {
    interface Window {
        example: any
    }
}

const Example: WalletAdapterInterface = {
    id: 'example',
    name: 'Example',
    icon: 'icon base64 string here',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'wallet download link here',
    createDeepLink(url: string, ops?: object): string {
        return `https://example.com/dapp/${url}`
    },
    isDetected: () => Boolean(window?.example),
    isConnected: async () => {
        return true // return true if connected
    },
    connect: async () => {
        // connect wallet here
        return window.example
    }
}

export default Example
