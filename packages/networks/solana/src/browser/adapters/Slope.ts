import { WalletPlatformEnum } from '@multiplechain/types'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import { WalletReadyState, type BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'

const slope = new SlopeWalletAdapter()

const Slope: WalletAdapterInterface = {
    id: 'slope',
    name: slope.name,
    icon: slope.icon,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://www.slope.finance/',
    isDetected: () => slope.readyState === WalletReadyState.Installed,
    isConnected: async () => slope.connected,
    connect: async (
        _provider?: ProviderInterface,
        _ops?: object
    ): Promise<BaseMessageSignerWalletAdapter> => {
        await slope.connect()
        return slope as BaseMessageSignerWalletAdapter
    }
}

export default Slope
