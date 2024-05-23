import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope'
import type { WalletAdapterInterface } from '@multiplechain/types'

const slope = new SlopeWalletAdapter()

const Slope: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'slope',
    name: slope.name,
    icon: slope.icon,
    provider: slope,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://www.slope.finance/',
    isDetected: () => slope.readyState === WalletReadyState.Installed,
    isConnected: async () => slope.connected,
    disconnect: async () => {
        await slope.disconnect()
    },
    connect: async (): Promise<WalletAdapter> => {
        await slope.connect()
        return slope as WalletAdapter
    }
}

export default Slope
