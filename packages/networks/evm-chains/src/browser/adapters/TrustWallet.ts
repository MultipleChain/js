import icons from './icons'
import { switcher } from './switcher'
import type { WindowEthereum } from './types'
import type { EIP1193Provider } from './EIP6963'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

const TrustWallet: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'trustwallet',
    name: 'TrustWallet',
    icon: icons.trustWallet,
    downloadLink: 'https://trustwallet.com/download',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => Boolean(window?.ethereum?.isTrust ?? window?.trustwallet),
    isConnected: async () => {
        // eslint-disable-next-line
        const trustWalletProvider = (window?.ethereum?.isTrust
            ? window.ethereum
            : window.trustwallet) as unknown as WindowEthereum
        return Boolean((await trustWalletProvider?.request({ method: 'eth_accounts' })).length)
    },
    connect: async (provider?: Provider): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line
                const trustWalletProvider = (window?.ethereum?.isTrust
                    ? window.ethereum
                    : window.trustwallet) as unknown as WindowEthereum
                trustWalletProvider
                    ?.request({ method: 'eth_requestAccounts' })
                    .then(() => {
                        // because mobile wallet doesn't support testnets
                        if (
                            window?.ethereum?.isTrust !== undefined &&
                            provider?.isTestnet() === true
                        ) {
                            resolve(trustWalletProvider)
                            return
                        }

                        switcher(trustWalletProvider, provider)
                            .then(() => {
                                resolve(trustWalletProvider)
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

export default TrustWallet
