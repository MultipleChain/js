import type { WalletAdapter } from '../Wallet.ts'
import type { Provider } from '../../services/Provider.ts'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import WalletConnectWalletAdapter from '@multiplechain/solana-walletconnect'
import type { ConnectConfig, WalletAdapterInterface } from '@multiplechain/types'

const icon =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGJhc2VQcm9maWxlPSJiYXNpYyIgaWQ9IkxheWVyXzEiCgkgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCAzODcuNiAyMzcuNiIKCSB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggaWQ9IldhbGxldENvbm5lY3RfMDAwMDAwNzM3MDMwNjM0MzgyMjA2NDI3MzAwMDAwMDI5MTc3MTc1NTIyMzY0NzI0OTZfIiBmaWxsPSIjM0I5OUZDIiBkPSJNNzkuNCw0Ni40CgljNjMuMi02MS45LDE2NS43LTYxLjksMjI4LjksMGw3LjYsNy40YzMuMiwzLjEsMy4yLDguMSwwLDExLjJsLTI2LDI1LjVjLTEuNiwxLjUtNC4xLDEuNS01LjcsMGwtMTAuNS0xMC4zCgljLTQ0LjEtNDMuMi0xMTUuNi00My4yLTE1OS43LDBsLTExLjIsMTFjLTEuNiwxLjUtNC4xLDEuNS01LjcsMEw3MSw2NS44Yy0zLjItMy4xLTMuMi04LjEsMC0xMS4yTDc5LjQsNDYuNHogTTM2Mi4xLDk5LjFsMjMuMiwyMi43CgljMy4yLDMuMSwzLjIsOC4xLDAsMTEuMkwyODAuOCwyMzUuM2MtMy4yLDMuMS04LjMsMy4xLTExLjQsMGMwLDAsMCwwLDAsMGwtNzQuMS03Mi42Yy0wLjgtMC44LTIuMS0wLjgtMi45LDBjMCwwLDAsMCwwLDAKCWwtNzQuMSw3Mi42Yy0zLjIsMy4xLTguMywzLjEtMTEuNCwwYzAsMCwwLDAsMCwwTDIuNCwxMzNjLTMuMi0zLjEtMy4yLTguMSwwLTExLjJsMjMuMi0yMi43YzMuMi0zLjEsOC4zLTMuMSwxMS40LDBsNzQuMSw3Mi42CgljMC44LDAuOCwyLjEsMC44LDIuOSwwYzAsMCwwLDAsMCwwbDc0LjEtNzIuNmMzLjItMy4xLDguMy0zLjEsMTEuNCwwYzAsMCwwLDAsMCwwbDc0LjEsNzIuNmMwLjgsMC44LDIuMSwwLjgsMi45LDBsNzQuMS03Mi42CglDMzUzLjgsOTYsMzU4LjksOTYsMzYyLjEsOTkuMXoiLz4KPC9zdmc+'

let isConnected = false

const WalletConnect: WalletAdapterInterface<Provider, WalletAdapter> = {
    icon,
    id: 'walletconnect',
    name: 'WalletConnect',
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => isConnected,
    disconnect: async () => {
        isConnected = false
        Object.keys(localStorage)
            .filter((x) => x.startsWith('wc@2'))
            .forEach((x) => {
                localStorage.removeItem(x)
            })
        localStorage.removeItem('walletconnect')
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')
    },
    connect: async (provider?: Provider, config?: ConnectConfig): Promise<WalletAdapter> => {
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        const walletConnect = new WalletConnectWalletAdapter({
            network: provider.isTestnet()
                ? WalletAdapterNetwork.Devnet
                : WalletAdapterNetwork.Mainnet,
            options: {
                projectId: config.projectId,
                relayUrl: 'wss://relay.walletconnect.com',
                qrcodeModalOptions: {
                    mobileLinks: ['trust'],
                    desktopLinks: [
                        // 'zerion',
                        // 'ledger'
                    ]
                }
            }
        })

        await walletConnect.connect()

        isConnected = true

        return walletConnect
    }
}

export default WalletConnect
