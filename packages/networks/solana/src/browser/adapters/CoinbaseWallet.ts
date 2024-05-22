import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import type { ConnectConfig, UnknownConfig, WalletAdapterInterface } from '@multiplechain/types'

const coinbase = new CoinbaseWalletAdapter()

const CoinbaseWallet: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'coinbasewallet',
    name: coinbase.name,
    icon: coinbase.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.coinbase.com/wallet/downloads',
    createDeepLink(url: string, _config?: UnknownConfig): string {
        return `https://go.cb-w.com/dapp?cb_url=${url}`
    },
    isDetected: () => coinbase.readyState === WalletReadyState.Installed,
    isConnected: async () => coinbase.connected,
    disconnect: async () => {
        await coinbase.disconnect()
    },
    connect: async (_provider?: Provider, _config?: ConnectConfig): Promise<WalletAdapter> => {
        await coinbase.connect()
        return coinbase
    }
}

export default CoinbaseWallet
