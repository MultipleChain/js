import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket'

const tokenPocket = new TokenPocketWalletAdapter()

const TokenPocket: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'tokenpocket',
    name: tokenPocket.name,
    icon: tokenPocket.icon,
    platforms: [WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.tokenpocket.pro/en/download/app',
    createDeepLink(url: string): string {
        return (
            'tpdapp://open?params=' +
            JSON.stringify({
                url,
                chain: 'Solana',
                source: url
            })
        )
    },
    isDetected: () => tokenPocket.readyState === WalletReadyState.Installed,
    isConnected: async () => tokenPocket.connected,
    disconnect: async () => {
        await tokenPocket.disconnect()
    },
    connect: async (): Promise<WalletProvider> => {
        await tokenPocket.connect()
        return tokenPocket as WalletProvider
    }
}

export default TokenPocket
