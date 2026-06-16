import { metaMask } from './icons'
import type { WalletProvider } from '../Wallet'
import type { Provider } from '../../services/Provider'
import type { Transaction } from '@mysten/sui/transactions'
import type { WalletAdapterInterface } from '@multiplechain/types'
import type { ReadonlyWalletAccount } from '@mysten/wallet-standard'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import {
    SNAP_ORIGIN as snapId,
    serializeSuiSignMessageInput,
    getAccounts as getAccountsBase,
    serializeSuiSignAndExecuteTransactionBlockInput
} from '@kunalabs-io/sui-snap-wallet'

interface WindowEthereum {
    isMetaMask?: boolean
    on: (event: string, callback: (data: any) => void) => void
    request: (payload: { method: string; params?: any[] | object }) => Promise<any>
}

declare global {
    interface Window {
        ethereum: WindowEthereum
    }
}

const getAccounts = async (): Promise<ReadonlyWalletAccount[]> => {
    // @ts-expect-error no worry
    return await getAccountsBase(window.ethereum)
}

const MetaMask: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'metamask',
    icon: metaMask,
    name: 'MetaMask Snap',
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://metamask.io/download/',
    isDetected: () => {
        return Boolean((window?.ethereum as unknown as WindowEthereum)?.isMetaMask)
    },
    isConnected: async () => {
        return Boolean((await getAccounts()).length)
    },
    connect: async (provider?: Provider) => {
        return await new Promise((resolve, reject) => {
            if (provider === undefined) {
                throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
            }

            const network = provider?.isTestnet() ? 'testnet' : 'mainnet'
            const metamaskProvider = window?.ethereum as unknown as WindowEthereum

            try {
                const walletProvider: WalletProvider = {
                    getAddress: async (): Promise<string> => {
                        return (await getAccounts())[0].address
                    },
                    signMessage: async (message: string): Promise<string> => {
                        const walletAccount = (await getAccounts())[0]
                        const serialized = serializeSuiSignMessageInput({
                            message: new TextEncoder().encode(message),
                            account: walletAccount
                        })
                        const res = await metamaskProvider.request({
                            method: 'wallet_invokeSnap',
                            params: {
                                snapId,
                                request: {
                                    method: 'signPersonalMessage',
                                    params: JSON.parse(JSON.stringify(serialized))
                                }
                            }
                        })
                        return res.signature
                    },
                    sendTransaction: async (transaction: Transaction): Promise<string> => {
                        const serialized = serializeSuiSignAndExecuteTransactionBlockInput({
                            // @ts-expect-error it will work
                            transactionBlock: transaction,
                            account: (await getAccounts())[0],
                            chain: `sui:${network}`
                        })
                        const res = await metamaskProvider.request({
                            method: 'wallet_invokeSnap',
                            params: {
                                snapId,
                                request: {
                                    method: 'signAndExecuteTransactionBlock',
                                    params: JSON.parse(JSON.stringify(serialized))
                                }
                            }
                        })
                        return res.digest
                    },
                    on: (event: string, callback: (data: any) => void) => {
                        metamaskProvider.on(event, callback)
                    }
                }

                const connect = async (): Promise<void> => {
                    try {
                        await metamaskProvider.request({
                            method: 'wallet_requestSnaps',
                            params: {
                                [snapId]: {}
                            }
                        })
                        resolve(walletProvider)
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
