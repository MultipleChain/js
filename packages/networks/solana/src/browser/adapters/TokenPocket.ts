import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket'
import type { ConnectConfig, UnknownConfig, WalletAdapterInterface } from '@multiplechain/types'

const tokenPocket = new TokenPocketWalletAdapter()

const TokenPocket: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'tokenpocket',
    name: tokenPocket.name,
    icon: tokenPocket.icon,
    platforms: [WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.tokenpocket.pro/en/download/app',
    createDeepLink(url: string, _config?: UnknownConfig): string {
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
    connect: async (_provider?: Provider, _config?: ConnectConfig): Promise<WalletAdapter> => {
        await tokenPocket.connect()
        return tokenPocket as WalletAdapter
    }
}

export default TokenPocket
