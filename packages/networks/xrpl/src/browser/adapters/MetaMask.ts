import { metaMask } from './icons'
import type { WalletProvider } from '../Wallet'
import type { EIP1193Provider } from './EIP6963'
import type { Provider } from '../../services/Provider'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { WalletAdapterInterface } from '@multiplechain/types'

export interface WindowEthereum extends EIP1193Provider {
    isTrust?: boolean
    isTronLink?: boolean
    isMetaMask?: boolean
}

declare global {
    interface Window {
        ethereum: WindowEthereum
    }
}

interface NetworkInfo {
    chainId: number
    explorerUrl: string
    name: string
    nodeUrl: string
}

const MetaMask: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'metamask',
    name: 'MetaMask Snap',
    icon: metaMask,
    downloadLink: 'https://metamask.io/download/',
    platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
    isDetected: () => {
        return Boolean((window?.ethereum as unknown as WindowEthereum)?.isMetaMask)
    },
    createDeepLink: (url: string): string => `https://metamask.app.link/dapp/${url}`,
    isConnected: async () => {
        return Boolean(
            (
                await (window?.ethereum as unknown as WindowEthereum).request({
                    method: 'eth_accounts'
                })
            ).length
        )
    },
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        return await new Promise((resolve, reject) => {
            if (provider === undefined) {
                throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
            }

            const chainId = provider !== undefined && provider?.isTestnet() ? 1 : 0

            const metamaskProvider = window?.ethereum as unknown as WindowEthereum
            try {
                const walletProvider: WalletProvider = {
                    getAddress: async (): Promise<string> => {
                        const result = await metamaskProvider.request({
                            method: 'wallet_invokeSnap',
                            params: {
                                snapId: 'npm:xrpl-snap',
                                request: {
                                    method: 'xrpl_getAccount'
                                }
                            }
                        })
                        return result.account
                    },
                    signMessage: async (message: string): Promise<string> => {
                        const { signature } = await metamaskProvider.request({
                            method: 'wallet_invokeSnap',
                            params: {
                                snapId: 'npm:xrpl-snap',
                                request: {
                                    method: 'xrpl_signMessage',
                                    params: {
                                        message
                                    }
                                }
                            }
                        })
                        return signature
                    },
                    sendXrp: async (to: string, amount: string): Promise<string> => {
                        const result = await metamaskProvider.request({
                            method: 'wallet_invokeSnap',
                            params: {
                                snapId: 'npm:xrpl-snap',
                                request: {
                                    method: 'xrpl_sign',
                                    params: {
                                        Amount: amount,
                                        Destination: to,
                                        TransactionType: 'Payment',
                                        Account: await walletProvider.getAddress()
                                    }
                                }
                            }
                        })
                        await provider.ws.connect()
                        await provider.ws.submit(result.tx_blob) // eslint-disable-line
                        return result.hash
                    },
                    on: (event: string, callback: (data: any) => void) => {
                        metamaskProvider.on(event, callback)
                    }
                }

                const getCurrentNetwork = async (): Promise<NetworkInfo> => {
                    return await metamaskProvider.request({
                        method: 'wallet_invokeSnap',
                        params: {
                            snapId: 'npm:xrpl-snap',
                            request: {
                                method: 'xrpl_getActiveNetwork'
                            }
                        }
                    })
                }

                const changeNetwork = async (chainId: number): Promise<void> => {
                    try {
                        await metamaskProvider.request({
                            method: 'wallet_invokeSnap',
                            params: {
                                snapId: 'npm:xrpl-snap',
                                request: {
                                    method: 'xrpl_changeNetwork',
                                    params: {
                                        chainId
                                    }
                                }
                            }
                        })
                    } catch (error) {
                        reject(error)
                    }
                }

                const connect = async (): Promise<void> => {
                    try {
                        await metamaskProvider.request({
                            method: 'wallet_requestSnaps',
                            params: {
                                'npm:xrpl-snap': {}
                            }
                        })

                        void getCurrentNetwork().then(async (network) => {
                            if (network.chainId !== chainId) {
                                await changeNetwork(chainId)
                            }

                            resolve(walletProvider)
                        })
                    } catch (error) {
                        reject(error)
                    }
                }

                void connect()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default MetaMask
