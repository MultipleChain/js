import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { BitgetWalletAdapter } from '@solana/wallet-adapter-bitkeep'

const bitget = new BitgetWalletAdapter()

const BitgetWallet: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'bitgetwallet',
    name: bitget.name,
    icon: bitget.icon,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://web3.bitget.com/en/wallet-download?type=3',
    createDeepLink(url: string, _ops?: object): string {
        return `https://bkcode.vip?action=dapp&url=${url}`
    },
    isDetected: () => bitget.readyState === WalletReadyState.Installed,
    isConnected: async () => bitget.connected,
    disconnect: async () => {
        await bitget.disconnect()
    },
    connect: async (_provider?: Provider, _ops?: object): Promise<WalletAdapter> => {
        await bitget.connect()
        return bitget as WalletAdapter
    }
}

export default BitgetWallet
