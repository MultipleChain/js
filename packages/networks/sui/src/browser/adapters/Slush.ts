import { slush } from './icons'
import type { WalletProvider } from '../Wallet'
import { WalletAdapter } from '@suiet/wallet-sdk'
import type { Provider } from '../../services/Provider'
import { adapterToProvider, getWalletByName } from './standard'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'

const Slush: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'slush',
    name: 'Slush',
    icon: slush,
    downloadLink: 'https://slush.app/',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => Boolean(getWalletByName('Slush')),
    isConnected: () => Boolean(getWalletByName('Slush')?.accounts.length),
    disconnect: async () => {
        const wallet = getWalletByName('Slush')
        try {
            if (wallet) {
                await new WalletAdapter(wallet).disconnect()
            }
        } catch (error) {
            console.error('Error disconnecting from Slush:', error)
        }
    },
    connect: async (provider?: Provider) => {
        const wallet = getWalletByName('Slush')
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (!wallet) {
            throw new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED)
        }

        const adapter = new WalletAdapter(wallet)

        return await new Promise((resolve, reject) => {
            adapter
                .connect({})
                .then(() => {
                    resolve(adapterToProvider(adapter, provider))
                })
                .catch(reject)
        })
    }
}

export default Slush
