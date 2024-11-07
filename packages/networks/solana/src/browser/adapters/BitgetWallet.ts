import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { BitgetWalletAdapter } from '@solana/wallet-adapter-bitkeep'
import type { WalletAdapterInterface } from '@multiplechain/types'

const bitget = new BitgetWalletAdapter()

const BitgetWallet: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'bitgetwallet',
    name: bitget.name,
    icon: bitget.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://web3.bitget.com/en/wallet-download?type=3',
    createDeepLink(url: string): string {
        return `https://bkcode.vip?action=dapp&url=${url}`
    },
    isDetected: () => bitget.readyState === WalletReadyState.Installed,
    isConnected: async () => bitget.connected,
    disconnect: async () => {
        await bitget.disconnect()
    },
    connect: async (): Promise<WalletProvider> => {
        await bitget.connect()
        return bitget as WalletProvider
    }
}

export default BitgetWallet
