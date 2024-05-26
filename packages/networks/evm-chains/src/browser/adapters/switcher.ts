import type { RequestType } from '../Wallet'
import networks from '../../services/Networks'
import type { EIP1193Provider } from './EIP6963'
import { ErrorTypeEnum } from '@multiplechain/types'
import type { EvmNetworkConfigInterface, Provider } from '../../services/Provider'

export const switcher = async (wallet: EIP1193Provider, provider?: Provider): Promise<boolean> => {
    const network = provider?.network

    const request = async (params: RequestType): Promise<any> => {
        const res = await wallet.request(params)
        if (res?.error !== undefined) {
            const error = res.error as {
                code: number
                message: string
            }
            if (error.code === -32000) {
                throw new Error(ErrorTypeEnum.RPC_TIMEOUT)
            }
            throw new Error(error.message)
        }

        return res
    }

    const addNetwork = async (network: EvmNetworkConfigInterface): Promise<boolean> => {
        return await new Promise((resolve, reject) => {
            try {
                request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: network.hexId,
                            chainName: network.name,
                            rpcUrls: [network.rpcUrl],
                            nativeCurrency: network.nativeCurrency,
                            blockExplorerUrls: [network.explorerUrl]
                        }
                    ]
                })
                    .then(() => {
                        resolve(true)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            } catch (error) {
                reject(error)
            }
        })
    }

    const changeNetwork = async (_network: EvmNetworkConfigInterface): Promise<boolean> => {
        return await new Promise((resolve, reject) => {
            const chainId = `0x${_network.id.toString(16)}`
            request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId }]
            })
                .then(() => {
                    resolve(true)
                })
                .catch((error) => {
                    if (
                        error.code === 4902 ||
                        String(error.message).includes('wallet_addEthereumChain')
                    ) {
                        const network = networks.findById(_network.id)
                        if (network === undefined) {
                            resolve(true)
                            return
                        }
                        addNetwork(network)
                            .then(() => {
                                resolve(true)
                            })
                            .catch((error) => {
                                reject(error)
                            })
                    } else {
                        reject(error)
                    }
                })
        })
    }

    const getChainId = async (): Promise<number> => {
        return parseInt((await request({ method: 'eth_chainId' })) as string, 16)
    }

    const maybeSwitch = async (): Promise<boolean> => {
        return await new Promise((resolve, reject) => {
            if (network === undefined) {
                resolve(true)
                return
            }
            try {
                const check = async (): Promise<void> => {
                    if ((await getChainId()) !== network.id) {
                        changeNetwork(network)
                            .then(() => {
                                setTimeout(() => {
                                    resolve(true)
                                }, 1000)
                            })
                            .catch((error) => {
                                reject(error)
                            })
                    } else {
                        resolve(true)
                    }
                }
                void check()
            } catch (error) {
                reject(error)
            }
        })
    }

    return await maybeSwitch()
}
