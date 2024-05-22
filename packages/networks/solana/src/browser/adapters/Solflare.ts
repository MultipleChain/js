import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { WalletReadyState, WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import type { ConnectConfig, UnknownConfig, WalletAdapterInterface } from '@multiplechain/types'

const solflare = new SolflareWalletAdapter()

declare global {
    interface Window {
        solflare?: {
            isSolflare?: boolean
        }
    }
}

const Solflare: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'solflare',
    name: solflare.name,
    icon: solflare.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://solflare.com/download#extension',
    createDeepLink(url: string, _config?: UnknownConfig): string {
        return `https://solflare.com/ul/v1/browse/${url}?ref=${url}`
    },
    isDetected: () => solflare.readyState === WalletReadyState.Installed,
    isConnected: async () => solflare.connected,
    disconnect: async () => {
        await solflare.disconnect()
    },
    connect: async (_provider?: Provider, _config?: ConnectConfig): Promise<WalletAdapter> => {
        const solflare = new SolflareWalletAdapter({
            network:
                _provider !== undefined && _provider?.isTestnet()
                    ? WalletAdapterNetwork.Devnet
                    : WalletAdapterNetwork.Mainnet
        })
        await solflare.connect()
        return solflare
    }
}

export default Solflare
