import icons from './icons'
import { switcher } from './switcher'
import type { EIP1193Provider } from './EIP6963'
import type { Provider } from '../../services/Provider'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { WalletAdapterInterface } from '@multiplechain/types'

const XdefiWallet: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'xdefiwallet',
    name: 'XdefiWallet',
    icon: icons.xdefiWallet,
    provider: window?.xfi?.ethereum,
    downloadLink: 'https://www.xdefi.io/',
    platforms: [WalletPlatformEnum.BROWSER],
    isDetected: () => Boolean(window?.xfi?.ethereum),
    isConnected: async () => {
        return Boolean((await window?.xfi?.ethereum?.request({ method: 'eth_accounts' })).length)
    },
    connect: async (provider?: Provider): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            const xfi = window?.xfi?.ethereum
            try {
                xfi
                    ?.request({ method: 'eth_requestAccounts' })
                    .then(() => {
                        switcher(xfi, provider)
                            .then(() => {
                                resolve(xfi)
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

export default XdefiWallet
