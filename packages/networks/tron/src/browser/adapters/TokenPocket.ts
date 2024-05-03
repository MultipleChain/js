import type { CustomAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import { TokenPocketAdapter } from '@tronweb3/tronwallet-adapter-tokenpocket'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'

const walletProvider = new TokenPocketAdapter()

declare global {
    interface Window {
        tokenpocket?: {
            tron: any
        }
    }
}

const TokenPocket: WalletAdapterInterface = {
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
    connect: async (_provider?: ProviderInterface): Promise<CustomAdapter> => {
        return await new Promise((resolve, reject) => {
            try {
                walletProvider
                    .connect()
                    .then(async () => {
                        resolve(walletProvider as CustomAdapter)
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
