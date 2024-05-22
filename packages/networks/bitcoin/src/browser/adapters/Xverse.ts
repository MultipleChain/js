import icons from './icons.ts'
import type { BitcoinWalletAdapter } from '../Wallet.ts'
import {
    ErrorTypeEnum,
    WalletPlatformEnum,
    type ProviderInterface,
    type WalletAdapterInterface
} from '@multiplechain/types'
import {
    getAddress,
    sendBtcTransaction,
    BitcoinNetworkType,
    signMessage,
    AddressPurpose
} from 'sats-connect'

let connected = false

const Xverse: WalletAdapterInterface = {
    id: 'xverse',
    name: 'Xverse',
    icon: icons.Xverse,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.xverse.app/download',
    isDetected: () => Boolean(window.XverseProviders?.BitcoinProvider),
    isConnected: async () => connected,
    connect: async (provider?: ProviderInterface): Promise<BitcoinWalletAdapter> => {
        return await new Promise((resolve, reject) => {
            const type =
                provider !== undefined && provider?.isTestnet()
                    ? BitcoinNetworkType.Testnet
                    : BitcoinNetworkType.Mainnet

            const walletAdapter: BitcoinWalletAdapter = {
                on: (_event: string, _callback: (data: any) => void) => {},
                signMessage: async (message: string) => {
                    const address = await walletAdapter.getAddress()
                    return await new Promise((resolve, reject) => {
                        signMessage({
                            payload: {
                                network: {
                                    type
                                },
                                address,
                                message
                            },
                            onFinish: (signature) => {
                                resolve(signature)
                            },
                            onCancel: () => {
                                reject(ErrorTypeEnum.WALLET_REQUEST_REJECTED)
                            }
                        }).catch(reject)
                    })
                },
                sendBitcoin: async (to: string, amount: number) => {
                    const senderAddress = await walletAdapter.getAddress()
                    return await new Promise((resolve, reject) => {
                        sendBtcTransaction({
                            payload: {
                                network: {
                                    type
                                },
                                recipients: [
                                    {
                                        address: to,
                                        amountSats: BigInt(amount)
                                    }
                                ],
                                senderAddress
                            },
                            onFinish: (txId) => {
                                resolve(txId)
                            },
                            onCancel: () => {
                                reject(ErrorTypeEnum.WALLET_REQUEST_REJECTED)
                            }
                        }).catch(reject)
                    })
                },
                getAddress: async () => ''
            }

            const connect = async (): Promise<BitcoinWalletAdapter> => {
                return await new Promise((resolve, reject) => {
                    try {
                        getAddress({
                            payload: {
                                purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
                                message: 'Address for receiving Ordinals and payments',
                                network: {
                                    type
                                }
                            },
                            onFinish: (response) => {
                                const addresses = Object.values(response.addresses)
                                const bitcoin = addresses.find(
                                    (address) => address.purpose === AddressPurpose.Payment
                                )

                                // for ordinals & BRC-20 integrations
                                // const ordinals = addresses.find(address => address.purpose == 'ordinals');

                                if (bitcoin === undefined) {
                                    reject(ErrorTypeEnum.WALLET_CONNECTION_FAILED)
                                    return
                                }

                                walletAdapter.getAddress = async () => {
                                    return bitcoin.address
                                }

                                resolve(walletAdapter)
                            },
                            onCancel: () => {
                                reject(ErrorTypeEnum.WALLET_REQUEST_REJECTED)
                            }
                        }).catch(reject)
                    } catch (error) {
                        reject(error)
                    }
                })
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

export default Xverse
