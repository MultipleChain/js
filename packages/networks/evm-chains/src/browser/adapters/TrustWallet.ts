import icons from './icons.ts'
import { switcher } from './switcher.ts'
import type { WindowEthereum } from './types.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { WalletAdapterInterface, ProviderInterface } from '@multiplechain/types'

const TrustWallet: WalletAdapterInterface = {
    id: 'trustwallet',
    name: 'TrustWallet',
    icon: icons.trustWallet,
    // eslint-disable-next-line
    provider: (window?.ethereum?.isTrust
        ? window.ethereum
        : window.trustwallet) as unknown as WindowEthereum,
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
    connect: async (provider?: ProviderInterface): Promise<EIP1193Provider> => {
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
