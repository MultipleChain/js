import icons from './icons.ts'
import { switcher } from './switcher.ts'
import type { WindowEthereum } from './types.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { WalletAdapterInterface, ProviderInterface } from '@multiplechain/types'

const metamaskProvider = window?.ethereum as unknown as WindowEthereum

const MetaMask: WalletAdapterInterface = {
    id: 'metamask',
    name: 'MetaMask',
    icon: icons.metaMask,
    provider: window.ethereum,
    downloadLink: 'https://metamask.io/download/',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => Boolean(metamaskProvider.isMetaMask),
    createDeepLink: (url: string): string => `https://metamask.app.link/dapp/${url}`,
    isConnected: async () => {
        return Boolean((await metamaskProvider.request({ method: 'eth_accounts' })).length)
    },
    connect: async (provider?: ProviderInterface): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            try {
                metamaskProvider
                    ?.request({ method: 'eth_requestAccounts' })
                    .then(() => {
                        switcher(metamaskProvider, provider)
                            .then(() => {
                                resolve(metamaskProvider)
                            })
                            .catch((error: any) => {
                                reject(error)
                            })
                    })
                    .catch((error: any) => {
                        reject(error)
                    })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default MetaMask
