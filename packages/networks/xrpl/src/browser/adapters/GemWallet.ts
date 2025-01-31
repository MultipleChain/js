import { gemWallet } from './icons'
import type { WalletProvider } from '../Wallet'
import type { Provider } from '../../services/Provider'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import { getAddress, getNetwork, isInstalled, on, sendPayment, signMessage } from '@gemwallet/api'

declare global {
    interface Window {
        gemWallet: boolean
    }
}

let address: string | undefined

const GemWallet: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'gem-wallet',
    name: 'GemWallet',
    icon: gemWallet,
    downloadLink:
        'https://chromewebstore.google.com/detail/gemwallet/egebedonbdapoieedfcfkofloclfghab',
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => window?.gemWallet,
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        return await new Promise((resolve, reject) => {
            if (provider === undefined) {
                throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
            }

            const chainId = provider !== undefined && provider?.isTestnet() ? 'Testnet' : 'Mainnet'

            try {
                const walletProvider: WalletProvider = {
                    getAddress: async (): Promise<string> => {
                        return address ?? ''
                    },
                    signMessage: async (message: string): Promise<string> => {
                        return await new Promise((resolve, reject) => {
                            signMessage(message)
                                .then(({ result }) => {
                                    if (result?.signedMessage) {
                                        resolve(result.signedMessage)
                                    } else {
                                        reject(new Error('Signing failed'))
                                    }
                                })
                                .catch(reject)
                        })
                    },
                    sendXrp: async (to: string, amount: string): Promise<string> => {
                        return await new Promise((resolve, reject) => {
                            sendPayment({
                                destination: to,
                                amount
                            })
                                .then((response) => {
                                    if (response.result?.hash) {
                                        resolve(response.result.hash)
                                    } else {
                                        if (response.type === 'reject') {
                                            reject(new Error(ErrorTypeEnum.WALLET_REQUEST_REJECTED))
                                        } else {
                                            reject(
                                                new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
                                            )
                                        }
                                    }
                                })
                                .catch(reject)
                        })
                    },
                    on
                }

                const connect = async (): Promise<void> => {
                    void isInstalled()
                        .then((res) => {
                            if (res.result.isInstalled) {
                                getAddress()
                                    .then(({ result }) => {
                                        if (result?.address) {
                                            address = result.address
                                            void getNetwork()
                                                .then(({ result }) => {
                                                    if (result?.network === chainId) {
                                                        resolve(walletProvider)
                                                    } else {
                                                        reject(
                                                            new Error(
                                                                ErrorTypeEnum.UNACCEPTED_CHAIN
                                                            )
                                                        )
                                                    }
                                                })
                                                .catch(reject)
                                        } else {
                                            reject(
                                                new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED)
                                            )
                                        }
                                    })
                                    .catch(reject)
                            } else {
                                reject(new Error('GemWallet is not installed'))
                            }
                        })
                        .catch(reject)
                }
                void connect()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default GemWallet
