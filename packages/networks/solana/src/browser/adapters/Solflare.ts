import { WalletPlatformEnum } from '@multiplechain/types'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import {
    WalletReadyState,
    WalletAdapterNetwork,
    type BaseMessageSignerWalletAdapter
} from '@solana/wallet-adapter-base'

const solflare = new SolflareWalletAdapter()

declare global {
    interface Window {
        solflare?: {
            isSolflare?: boolean
        }
    }
}

const Solflare: WalletAdapterInterface = {
    id: 'solflare',
    name: solflare.name,
    icon: solflare.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://solflare.com/download#extension',
    createDeepLink(url: string, _ops?: object): string {
        return `https://solflare.com/ul/v1/browse/${url}?ref=${url}`
    },
    isDetected: () => solflare.readyState === WalletReadyState.Installed,
    isConnected: async () => solflare.connected,
    disconnect: async () => {
        await solflare.disconnect()
    },
    connect: async (
        _provider?: ProviderInterface,
        _ops?: object
    ): Promise<BaseMessageSignerWalletAdapter> => {
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
