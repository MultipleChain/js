import networks from '../../services/Networks.ts'
import type { ProviderInterface } from '@multiplechain/types'
import type { EvmNetworkConfigInterface } from '../../services/Provider.ts'

export const switcher = async (wallet: any, provider?: ProviderInterface): Promise<boolean> => {
    const network = provider?.network as EvmNetworkConfigInterface

    const request = async (params: any): Promise<any> => {
        const res = await wallet.request(params)
        if (res?.error !== undefined) {
            const error = res.error as {
                code: number
                message: string
            }
            if (error.code === -32000) {
                throw new Error('rpc-timeout')
            }
            throw new Error(error.message)
        }

        return res
    }

    const addNetwork = async (network: EvmNetworkConfigInterface): Promise<void> => {
        void new Promise((resolve, reject) => {
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
            const network = networks.findById(_network.id)
            if (network === undefined) {
                resolve(true)
                return
            }
            const chainId = `0x${network.id.toString(16)}`
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
