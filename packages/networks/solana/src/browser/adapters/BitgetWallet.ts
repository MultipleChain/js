import { WalletPlatformEnum } from '@multiplechain/types'
import { BitgetWalletAdapter } from '@solana/wallet-adapter-bitkeep'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import { WalletReadyState, type BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'

const bitget = new BitgetWalletAdapter()

const BitgetWallet: WalletAdapterInterface = {
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
    connect: async (
        _provider?: ProviderInterface,
        _ops?: object
    ): Promise<BaseMessageSignerWalletAdapter> => {
        await bitget.connect()
        return bitget as BaseMessageSignerWalletAdapter
    }
}

export default BitgetWallet
