import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import type { ConnectConfig, UnknownConfig, WalletAdapterInterface } from '@multiplechain/types'

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

const Phantom: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'phantom',
    name: phantomAdapter.name,
    icon: phantomAdapter.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://phantom.app/download',
    createDeepLink(url: string, _config?: UnknownConfig): string {
        return `https://phantom.app/ul/browse/${url}?ref=${url}`
    },
    isDetected: () =>
        Boolean(
            window.phantom?.solana?.isPhantom !== undefined && window.phantom?.connect === undefined
        ),
    isConnected: async () => phantomAdapter.connected,
    disconnect: async () => {
        await phantomAdapter.disconnect()
    },
    connect: async (_provider?: Provider, _config?: ConnectConfig): Promise<WalletAdapter> => {
        await phantomAdapter.connect()
        return phantomAdapter
    }
}

export default Phantom
