import icons from './icons'
import { switcher } from './switcher'
import type { EIP1193Provider } from './EIP6963'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

const OkxWallet: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'okxwallet',
    name: 'OkxWallet',
    icon: icons.okxWallet,
    downloadLink: 'https://www.okx.com/download',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    createDeepLink: (url: string): string => `okx://wallet/dapp/details?dappUrl=${url}`,
    isDetected: () => Boolean(window?.okxwallet),
    isConnected: async () => {
        return Boolean((await window?.okxwallet?.request({ method: 'eth_accounts' })).length)
    },
    connect: async (provider?: Provider): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            const okx = window?.okxwallet
            try {
                okx
                    ?.request({ method: 'eth_requestAccounts' })
                    .then(() => {
                        switcher(okx, provider)
                            .then(() => {
                                resolve(okx)
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

export default OkxWallet
