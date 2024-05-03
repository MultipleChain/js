import { sleep } from '@multiplechain/utils'
import type { CustomAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'

const walletProvider = new TronLinkAdapter()

const TronLink: WalletAdapterInterface = {
    id: 'tronlink',
    name: 'TronLink',
    icon: walletProvider.icon,
    provider: walletProvider,
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
    connect: async (_provider?: ProviderInterface): Promise<CustomAdapter> => {
        const provider = _provider as Provider
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
