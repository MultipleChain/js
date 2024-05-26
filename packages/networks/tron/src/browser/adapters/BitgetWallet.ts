import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { BitKeepAdapter } from '@tronweb3/tronwallet-adapter-bitkeep'

const walletProvider = new BitKeepAdapter()

declare global {
    interface Window {
        bitkeep?: {
            tronLink?: boolean
        }
    }
}

const BitgetWallet: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'bitgetwallet',
    name: 'BitgetWallet',
    icon: walletProvider.icon,
    provider: walletProvider,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://web3.bitget.com/en/wallet-download?type=3',
    createDeepLink(url: string): string {
        return 'https://bkcode.vip?action=dapp&url=' + url
    },
    isDetected: () => Boolean(window.bitkeep?.tronLink),
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

export default BitgetWallet
