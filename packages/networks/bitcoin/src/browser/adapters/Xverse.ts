import icons from './icons.ts'
import type { WalletProvider } from '../Wallet.ts'
import type { Provider } from '../../services/Provider.ts'
import {
    ErrorTypeEnum,
    WalletPlatformEnum,
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
let walletProvider: WalletProvider | undefined

const Xverse: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'xverse',
    name: 'Xverse',
    icon: icons.Xverse,
    provider: walletProvider,
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    downloadLink: 'https://www.xverse.app/download',
    isDetected: () => Boolean(window.XverseProviders?.BitcoinProvider),
    isConnected: async () => connected,
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        return await new Promise((resolve, reject) => {
            const type =
                provider !== undefined && provider?.isTestnet()
                    ? BitcoinNetworkType.Testnet
                    : BitcoinNetworkType.Mainnet

            const _walletProvider: WalletProvider = {
                on: (_event: string, _callback: (data: any) => void) => {},
                signMessage: async (message: string) => {
                    const address = await _walletProvider.getAddress()
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
                    const senderAddress = await _walletProvider.getAddress()
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

            const connect = async (): Promise<WalletProvider> => {
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

                                _walletProvider.getAddress = async () => {
                                    return bitcoin.address
                                }

                                resolve(_walletProvider)
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
                    .then(() => {
                        connected = true
                        resolve((walletProvider = _walletProvider))
                    })
                    .catch(reject)
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Xverse
