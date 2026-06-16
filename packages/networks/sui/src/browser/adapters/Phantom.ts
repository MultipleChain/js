import { phantom } from './icons'
import type { WalletProvider } from '../Wallet'
import { WalletAdapter } from '@suiet/wallet-sdk'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import { adapterToProvider, getWalletByName, type BasicAccount } from './standard'

declare global {
    interface Window {
        phantom?: {
            sui?: {
                isPhantom?: boolean
                requestAccount: () => Promise<BasicAccount>
            }
        }
    }
}

const Phantom: WalletAdapterInterface<Provider, WalletProvider> = {
    icon: phantom,
    id: 'phantom',
    name: 'Phantom',
    downloadLink: 'https://phantom.app/download',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    createDeepLink: (url: string): string => `https://phantom.app/ul/browse/${url}?ref=${url}`,
    isDetected: () => Boolean(window.phantom?.sui?.isPhantom),
    isConnected: async () => {
        if (!window.phantom?.sui) {
            return false
        }

        return Boolean(await window.phantom?.sui?.requestAccount())
    },
    disconnect: async () => {
        const wallet = getWalletByName('Phantom')
        try {
            if (wallet) {
                await new WalletAdapter(wallet).disconnect()
            }
        } catch (error) {
            console.error('Error disconnecting from Phantom wallet:', error)
        }
    },
    connect: async (provider?: Provider) => {
        const wallet = getWalletByName('Phantom')
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (!wallet || !window.phantom?.sui) {
            throw new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED)
        }

        const adapter = new WalletAdapter(wallet)

        const account = await window.phantom?.sui?.requestAccount()

        return await new Promise((resolve, reject) => {
            adapter
                .connect({})
                .then(() => {
                    resolve(adapterToProvider(adapter, provider, account as BasicAccount))
                })
                .catch(reject)
        })
    }
}

export default Phantom
