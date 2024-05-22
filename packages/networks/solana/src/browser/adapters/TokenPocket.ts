import { WalletPlatformEnum } from '@multiplechain/types'
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import { WalletReadyState, type BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'

const tokenPocket = new TokenPocketWalletAdapter()

const TokenPocket: WalletAdapterInterface = {
    id: 'tokenpocket',
    name: tokenPocket.name,
    icon: tokenPocket.icon,
    platforms: [WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.tokenpocket.pro/en/download/app',
    createDeepLink(url: string, _ops?: object): string {
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
    connect: async (
        _provider?: ProviderInterface,
        _ops?: object
    ): Promise<BaseMessageSignerWalletAdapter> => {
        await tokenPocket.connect()
        return tokenPocket as BaseMessageSignerWalletAdapter
    }
}

export default TokenPocket
