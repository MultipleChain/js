import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { WalletReadyState, WalletAdapterNetwork } from '@solana/wallet-adapter-base'

const solflare = new SolflareWalletAdapter()

declare global {
    interface Window {
        solflare?: {
            isSolflare?: boolean
        }
    }
}

const Solflare: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'solflare',
    name: solflare.name,
    icon: solflare.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://solflare.com/download#extension',
    createDeepLink(url: string): string {
        return `https://solflare.com/ul/v1/browse/${url}?ref=${url}`
    },
    isDetected: () => solflare.readyState === WalletReadyState.Installed,
    isConnected: async () => solflare.connected,
    disconnect: async () => {
        await solflare.disconnect()
    },
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        const solflare = new SolflareWalletAdapter({
            network:
                provider !== undefined && provider?.isTestnet()
                    ? WalletAdapterNetwork.Devnet
                    : WalletAdapterNetwork.Mainnet
        })
        await solflare.connect()
        return solflare
    }
}

export default Solflare
