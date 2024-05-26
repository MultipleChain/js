import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'

const coinbase = new CoinbaseWalletAdapter()

const CoinbaseWallet: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'coinbasewallet',
    name: coinbase.name,
    icon: coinbase.icon,
    provider: coinbase,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.coinbase.com/wallet/downloads',
    createDeepLink(url: string): string {
        return `https://go.cb-w.com/dapp?cb_url=${url}`
    },
    isDetected: () => coinbase.readyState === WalletReadyState.Installed,
    isConnected: async () => coinbase.connected,
    disconnect: async () => {
        await coinbase.disconnect()
    },
    connect: async (): Promise<WalletProvider> => {
        await coinbase.connect()
        return coinbase
    }
}

export default CoinbaseWallet
