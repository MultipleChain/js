import icons from './icons.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import type { BitcoinWalletAdapter } from '../Wallet.ts'

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

const Leather: WalletAdapterInterface = {
    id: 'leather',
    name: 'Leather',
    icon: icons.Leather,
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://leather.io/install-extension',
    isDetected: () => Boolean(window.LeatherProvider),
    isConnected: async () => connected,
    connect: async (provider?: ProviderInterface): Promise<BitcoinWalletAdapter> => {
        return await new Promise((resolve, reject) => {
            const leather = window.LeatherProvider

            const network = provider !== undefined && provider?.isTestnet() ? 'testnet' : 'mainnet'

            const walletAdapter: BitcoinWalletAdapter = {
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
                                    address: to,
                                    amount,
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

            const connect = async (): Promise<BitcoinWalletAdapter> => {
                const addresses = (
                    await leather.request('getAddresses', {
                        network
                    })
                ).result.addresses

                const bitcoin = addresses.find((address: any) => address.type === 'p2wpkh')

                // for ordinals & BRC-20 integrations
                // const ordinals = addresses.find(address => address.type == 'p2tr');

                walletAdapter.getAddress = async () => {
                    return bitcoin.address
                }

                return walletAdapter
            }

            try {
                connect()
                    .then((walletAdapter) => {
                        connected = true
                        resolve(walletAdapter)
                    })
                    .catch(reject)
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Leather