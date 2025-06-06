import icons from './icons'
import { switcher } from './switcher'
import type { WindowEthereum } from './types'
import type { EIP1193Provider } from './EIP6963'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

const MetaMask: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'metamask',
    name: 'MetaMask',
    icon: icons.metaMask,
    downloadLink: 'https://metamask.io/download/',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => {
        return Boolean((window?.ethereum as unknown as WindowEthereum)?.isMetaMask)
    },
    createDeepLink: (url: string): string => `https://metamask.app.link/dapp/${url}`,
    isConnected: async () => {
        return Boolean(
            (
                await (window?.ethereum as unknown as WindowEthereum).request({
                    method: 'eth_accounts'
                })
            ).length
        )
    },
    connect: async (provider?: Provider): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            const metamaskProvider = window?.ethereum as unknown as WindowEthereum
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
