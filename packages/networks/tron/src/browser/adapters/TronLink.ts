import { sleep } from '@multiplechain/utils'
import type { WalletProvider } from '../Wallet'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'

const walletProvider = new TronLinkAdapter()

const TronLink: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'tronlink',
    name: 'TronLink',
    icon: walletProvider.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.tronlink.org/dlDetails/',
    createDeepLink(url: string): string {
        return (
            'tronlinkoutside://pull.activity?param=' +
            JSON.stringify({
                url,
                action: 'open',
                protocol: 'tronlink',
                version: '1.0'
            })
        )
    },
    isDetected: () => Boolean(window.tronLink),
    isConnected: () => Boolean(walletProvider.connected),
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        return await new Promise((resolve, reject) => {
            try {
                walletProvider
                    .connect()
                    .then(async () => {
                        if (provider.node.id !== (await walletProvider.network()).chainId) {
                            await walletProvider.switchChain(provider.node.id)
                        }
                        await sleep(500)
                        resolve(walletProvider)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default TronLink
