import icons from './icons.ts'
import { switcher } from './switcher.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { WalletAdapterInterface, ProviderInterface } from '@multiplechain/types'

const XdefiWallet: WalletAdapterInterface = {
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
    connect: async (provider?: ProviderInterface): Promise<EIP1193Provider> => {
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
