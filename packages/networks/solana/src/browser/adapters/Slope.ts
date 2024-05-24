import type { WalletProvider } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope'
import type { WalletAdapterInterface } from '@multiplechain/types'

const slope = new SlopeWalletAdapter()

const Slope: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'slope',
    name: slope.name,
    icon: slope.icon,
    provider: slope as WalletProvider,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://www.slope.finance/',
    isDetected: () => slope.readyState === WalletReadyState.Installed,
    isConnected: async () => slope.connected,
    disconnect: async () => {
        await slope.disconnect()
    },
    connect: async (): Promise<WalletProvider> => {
        await slope.connect()
        return slope as WalletProvider
    }
}

export default Slope
