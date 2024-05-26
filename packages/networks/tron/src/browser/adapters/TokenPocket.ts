import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { TokenPocketAdapter } from '@tronweb3/tronwallet-adapter-tokenpocket'

const walletProvider = new TokenPocketAdapter()

declare global {
    interface Window {
        tokenpocket?: {
            tron: any
        }
    }
}

const TokenPocket: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'tokenpocket',
    name: 'TokenPocket',
    icon: walletProvider.icon,
    provider: walletProvider,
    platforms: [WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.tokenpocket.pro/en/download/app',
    createDeepLink(url: string): string {
        return (
            'tpdapp://open?params=' +
            JSON.stringify({
                url,
                chain: 'Tron',
                source: url
            })
        )
    },
    isDetected: () => Boolean(window.tokenpocket?.tron),
    isConnected: () => Boolean(walletProvider.connected),
    connect: async (): Promise<WalletProvider> => {
        return await new Promise((resolve, reject) => {
            try {
                walletProvider
                    .connect()
                    .then(async () => {
                        resolve(walletProvider)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default TokenPocket
