import type { WalletAdapter } from '../Wallet.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider.ts'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope'
import type { ConnectConfig, WalletAdapterInterface } from '@multiplechain/types'

const slope = new SlopeWalletAdapter()

const Slope: WalletAdapterInterface<Provider, WalletAdapter> = {
    id: 'slope',
    name: slope.name,
    icon: slope.icon,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://www.slope.finance/',
    isDetected: () => slope.readyState === WalletReadyState.Installed,
    isConnected: async () => slope.connected,
    disconnect: async () => {
        await slope.disconnect()
    },
    connect: async (_provider?: Provider, _config?: ConnectConfig): Promise<WalletAdapter> => {
        await slope.connect()
        return slope as WalletAdapter
    }
}

export default Slope
