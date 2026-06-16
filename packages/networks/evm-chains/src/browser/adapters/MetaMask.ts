import icons from './icons'
import { switcher } from './switcher'
import type { WindowEthereum } from './types'
import { getEIP6963ProviderByRdns } from './EIP6963'
import type { EIP1193Provider } from './EIP6963'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

const METAMASK_RDNS = 'io.metamask'

/**
 * Resolves the real MetaMask provider.
 *
 * Other wallets (e.g. Trust Wallet) frequently override `window.ethereum` and even
 * spoof `isMetaMask`, so we first try EIP-6963 discovery which reaches MetaMask by
 * its `rdns` regardless of who owns `window.ethereum`. We then fall back to the
 * legacy `window.ethereum.providers` array and finally to `window.ethereum` itself,
 * making sure in both cases that the provider is MetaMask and not a spoofing wallet.
 * @returns the MetaMask provider, if available
 */
const getMetaMaskProvider = (): WindowEthereum | undefined => {
    const eip6963Provider = getEIP6963ProviderByRdns(METAMASK_RDNS)
    if (eip6963Provider !== undefined) {
        return eip6963Provider as unknown as WindowEthereum
    }

    const ethereum = window?.ethereum as unknown as WindowEthereum | undefined
    if (ethereum === undefined) {
        return undefined
    }

    if (Array.isArray(ethereum.providers)) {
        const found = ethereum.providers.find((p) => p?.isMetaMask === true && p?.isTrust !== true)
        if (found !== undefined) {
            return found
        }
    }

    if (ethereum.isMetaMask === true && ethereum.isTrust !== true) {
        return ethereum
    }

    return undefined
}

const MetaMask: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'metamask',
    name: 'MetaMask',
    icon: icons.metaMask,
    downloadLink: 'https://metamask.io/download/',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => Boolean(getMetaMaskProvider()),
    createDeepLink: (url: string): string => `https://metamask.app.link/dapp/${url}`,
    isConnected: async () => {
        const metamaskProvider = getMetaMaskProvider()
        if (metamaskProvider === undefined) {
            return false
        }
        return Boolean(
            (
                await metamaskProvider.request({
                    method: 'eth_accounts'
                })
            ).length
        )
    },
    connect: async (provider?: Provider): Promise<EIP1193Provider> => {
        return await new Promise((resolve, reject) => {
            const metamaskProvider = getMetaMaskProvider()
            if (metamaskProvider === undefined) {
                reject(new Error('MetaMask is not detected'))
                return
            }
            try {
                metamaskProvider
                    .request({ method: 'eth_requestAccounts' })
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
