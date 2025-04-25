import { suiet } from './icons'
import type { WalletProvider } from '../Wallet'
import { WalletAdapter } from '@suiet/wallet-sdk'
import type { Provider } from '../../services/Provider'
import { adapterToProvider, getWalletByName } from './standard'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'

const wallet = getWalletByName('Suiet')

const Suiet: WalletAdapterInterface<Provider, WalletProvider> = {
    icon: suiet,
    id: 'suiet',
    name: 'Suiet',
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://suiet.app/install',
    isDetected: () => Boolean(wallet),
    isConnected: () => Boolean(wallet?.accounts.length),
    connect: async (provider?: Provider) => {
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

export default Suiet
