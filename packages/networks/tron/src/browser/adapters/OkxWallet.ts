import type { CustomAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import { OkxWalletAdapter } from '@tronweb3/tronwallet-adapter-okxwallet'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'

const walletProvider = new OkxWalletAdapter()

const OkxWallet: WalletAdapterInterface = {
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

export default OkxWallet
