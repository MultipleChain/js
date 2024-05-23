import type { CustomAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { OkxWalletAdapter } from '@tronweb3/tronwallet-adapter-okxwallet'

const walletProvider = new OkxWalletAdapter()

const OkxWallet: WalletAdapterInterface<Provider, CustomAdapter> = {
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
    connect: async (): Promise<CustomAdapter> => {
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

export default OkxWallet
