import icons from './icons.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import type { BitcoinWalletAdapter } from '../Wallet.ts'

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

const UniSat: WalletAdapterInterface = {
    id: 'unisat',
    name: 'UniSat',
    icon: icons.UniSat,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://unisat.io/download',
    isDetected: () => Boolean(window.unisat?.requestAccounts),
    isConnected: async () => window?.unisat?._isConnected ?? false,
    connect: async (provider?: ProviderInterface): Promise<BitcoinWalletAdapter> => {
        return await new Promise((resolve, reject) => {
            const network = provider !== undefined && provider?.isTestnet() ? 'testnet' : 'livenet'

            const walletAdapter: BitcoinWalletAdapter = {
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
                                resolve(walletAdapter)
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
