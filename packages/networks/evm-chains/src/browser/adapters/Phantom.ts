import icons from './icons'
import type { EIP1193Provider } from './EIP6963'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

const Phantom: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'phantom',
    name: 'Phantom',
    icon: icons.phantom,
    downloadLink: 'https://phantom.app/',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => Boolean(window?.phantom?.ethereum),
    createDeepLink: (url: string): string => `https://phantom.app/ul/browse/${url}?ref=${url}`,
    isConnected: async () => {
        return Boolean(
            (await window?.phantom?.ethereum?.request({ method: 'eth_accounts' })).length
        )
    },
    connect: async (): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            const phantom = window?.phantom?.ethereum
            try {
                phantom
                    ?.request({ method: 'eth_requestAccounts' })
                    .then(() => {
                        resolve(phantom)
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

export default Phantom
