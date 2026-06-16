import icons from './icons'
import type { WalletProvider } from '../Wallet'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'

declare global {
    interface Window {
        btc: {
            listen?: (event: string, callback: (data: any) => void) => void
        }
        LeatherProvider: {
            request: (method: string, params: any) => Promise<any>
        }
    }
}

let connected = false

const Leather: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'leather',
    name: 'Leather',
    icon: icons.Leather,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://leather.io/install-extension',
    isDetected: () => Boolean(window.LeatherProvider),
    isConnected: async () => connected,
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        return await new Promise((resolve, reject) => {
            const leather = window.LeatherProvider

            const network = provider !== undefined && provider?.isTestnet() ? 'testnet' : 'mainnet'

            const walletProvider: WalletProvider = {
                on: (event, callback) => {
                    if (window.btc?.listen !== undefined) {
                        window.btc.listen(event, callback)
                    }
                },
                signMessage: async (message: string) => {
                    const response = await leather.request('signMessage', {
                        message,
                        network,
                        account: 0,
                        paymentType: 'p2wpkh'
                    })

                    return response.result.signature as string
                },
                sendBitcoin: async (to: string, amount: number) => {
                    return await new Promise((resolve, reject) => {
                        try {
                            leather
                                .request('sendTransfer', {
                                    recipients: [
                                        {
                                            address: to,
                                            amount: String(amount)
                                        }
                                    ],
                                    network
                                })
                                .then((response) => {
                                    resolve(response.result.txid as string)
                                })
                                .catch(({ error }) => {
                                    reject(error)
                                })
                        } catch (error) {
                            reject(error)
                        }
                    })
                },
                getAddress: async () => ''
            }

            const connect = async (): Promise<WalletProvider> => {
                const addresses = (
                    await leather.request('getAddresses', {
                        network
                    })
                ).result.addresses

                const bitcoin = addresses.find((address: any) => address.type === 'p2wpkh')

                // for ordinals & BRC-20 integrations
                // const ordinals = addresses.find(address => address.type == 'p2tr');

                walletProvider.getAddress = async () => {
                    return bitcoin.address
                }

                return walletProvider
            }

            try {
                connect()
                    .then(() => {
                        connected = true
                        resolve(walletProvider)
                    })
                    .catch(reject)
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Leather
