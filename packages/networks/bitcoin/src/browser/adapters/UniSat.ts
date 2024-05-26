import icons from './icons'
import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

declare global {
    interface Window {
        unisat: {
            _isConnected: boolean
            getAccounts: () => Promise<string[]>
            requestAccounts: () => Promise<void>
            signMessage: (message: string) => Promise<string>
            switchNetwork: (network: string) => Promise<void>
            on: (event: string, callback: (data: any) => void) => void
            sendBitcoin: (to: string, amount: number) => Promise<string>
        }
    }
}

let walletProvider: WalletProvider | undefined

const UniSat: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'unisat',
    name: 'UniSat',
    icon: icons.UniSat,
    provider: walletProvider,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://unisat.io/download',
    isDetected: () => Boolean(window.unisat?.requestAccounts),
    isConnected: async () => window?.unisat?._isConnected ?? false,
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        return await new Promise((resolve, reject) => {
            const network = provider !== undefined && provider?.isTestnet() ? 'testnet' : 'livenet'

            const _walletProvider: WalletProvider = {
                on: window.unisat.on,
                signMessage: window.unisat.signMessage,
                sendBitcoin: window.unisat.sendBitcoin,
                getAddress: async () => {
                    return (await window.unisat.getAccounts())[0]
                }
            }

            try {
                window.unisat
                    .requestAccounts()
                    .then(() => {
                        window.unisat
                            .switchNetwork(network)
                            .then(() => {
                                resolve((walletProvider = _walletProvider))
                            })
                            .catch(reject)
                    })
                    .catch(reject)
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default UniSat
