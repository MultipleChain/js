import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { OkxWalletAdapter } from '@tronweb3/tronwallet-adapter-okxwallet'

const walletProvider = new OkxWalletAdapter()

const OkxWallet: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'okxwallet',
    name: 'OkxWallet',
    icon: walletProvider.icon,
    provider: walletProvider,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.okx.com/download',
    createDeepLink(url: string): string {
        return 'okx://wallet/dapp/details?dappUrl=' + url
    },
    isDetected: () => Boolean(window.okxwallet?.tronLink),
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

export default OkxWallet
