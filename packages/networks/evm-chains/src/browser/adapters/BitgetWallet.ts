import icons from './icons.ts'
import { switcher } from './switcher.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import type { WalletAdapterInterface } from '@multiplechain/types'

const BitgetWallet: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'bitgetwallet',
    name: 'BitgetWallet',
    icon: icons.bitgetWallet,
    provider: window?.bitkeep?.ethereum,
    downloadLink: 'https://web3.bitget.com/en/wallet-download?type=3',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    createDeepLink: (url: string): string => `https://bkcode.vip?action=dapp&url=${url}`,
    isDetected: () => Boolean(window?.bitkeep?.ethereum),
    isConnected: async () => {
        return Boolean(
            (await window?.bitkeep?.ethereum?.request({ method: 'eth_accounts' })).length
        )
    },
    connect: async (provider?: Provider): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            const bitget = window?.bitkeep?.ethereum
            try {
                bitget
                    ?.request({ method: 'eth_requestAccounts' })
                    .then(() => {
                        switcher(bitget, provider)
                            .then(() => {
                                resolve(bitget)
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

export default BitgetWallet
