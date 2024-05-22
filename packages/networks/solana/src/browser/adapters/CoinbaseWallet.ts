import { WalletPlatformEnum } from '@multiplechain/types'
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import { WalletReadyState, type BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'

const coinbase = new CoinbaseWalletAdapter()

const CoinbaseWallet: WalletAdapterInterface = {
    id: 'coinbasewallet',
    name: coinbase.name,
    icon: coinbase.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.coinbase.com/wallet/downloads',
    createDeepLink(url: string, _ops?: object): string {
        return `https://go.cb-w.com/dapp?cb_url=${url}`
    },
    isDetected: () => coinbase.readyState === WalletReadyState.Installed,
    isConnected: async () => coinbase.connected,
    disconnect: async () => {
        await coinbase.disconnect()
    },
    connect: async (
        _provider?: ProviderInterface,
        _ops?: object
    ): Promise<BaseMessageSignerWalletAdapter> => {
        await coinbase.connect()
        return coinbase
    }
}

export default CoinbaseWallet
