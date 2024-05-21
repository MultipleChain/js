import { WalletPlatformEnum } from '@multiplechain/types'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import type { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'

const phantomAdapter = new PhantomWalletAdapter()

declare global {
    interface Window {
        phantom?: {
            connect?: () => Promise<void>
            solana?: {
                isPhantom?: boolean
            }
        }
    }
}

const Phantom: WalletAdapterInterface = {
    id: 'phantom',
    name: phantomAdapter.name,
    icon: phantomAdapter.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://phantom.app/download',
    createDeepLink(url: string, _ops?: object): string {
        return `https://phantom.app/ul/browse/${url}?ref=${url}`
    },
    isDetected: () =>
        Boolean(
            window.phantom?.solana?.isPhantom !== undefined && window.phantom?.connect === undefined
        ),
    isConnected: async () => phantomAdapter.connected,
    connect: async (
        _provider?: ProviderInterface,
        _ops?: object
    ): Promise<BaseMessageSignerWalletAdapter> => {
        await phantomAdapter.connect()
        return phantomAdapter
    }
}

export default Phantom
