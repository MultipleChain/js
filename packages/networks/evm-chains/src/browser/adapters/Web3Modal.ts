import icons from './icons.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import type { Chain } from '@web3modal/scaffold-utils/ethers'
import type { CustomWallet, Metadata } from '@web3modal/core'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers'
import type { Web3Modal as Web3ModalType } from '@web3modal/ethers'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import { networks, type EvmNetworkConfigInterface } from '../../index.ts'
import type { WalletAdapterInterface, ProviderInterface } from '@multiplechain/types'

interface Web3ModalOps {
    projectId: string
    themeMode?: 'dark' | 'light'
    enableEIP6963?: boolean
    enableInjected?: boolean
    enableCoinbase?: boolean
    rpcUrl?: string
    defaultChainId?: number
    metadata: Metadata
    customWallets?: CustomWallet[]
}

export interface Web3ModalAdapterInterface extends Omit<WalletAdapterInterface, 'connect'> {
    connect: (provider?: ProviderInterface, ops?: Web3ModalOps) => Promise<EIP1193Provider>
}

let modal: Web3ModalType

const chains: Chain[] = networks
    .getAll()
    .map((network: any) => {
        return {
            chainId: network.id,
            name: network.name ?? network.nativeCurrency.symbol,
            currency: network.nativeCurrency.symbol,
            explorerUrl: network.explorerUrl,
            rpcUrl: network.rpcUrl
        }
    })
    .filter((network: any) => network)

let currentNetwork: Chain
let clickedAnyWallet = false
let connectRejectMethod: (reason?: any) => void
let connectResolveMethod: (value: EIP1193Provider | PromiseLike<EIP1193Provider>) => void

const web3Modal = (ops: Web3ModalOps): Web3ModalType => {
    if (modal !== undefined) {
        return modal
    }

    const ethersConfig = defaultConfig({
        metadata: ops.metadata,
        enableEIP6963: ops.enableEIP6963,
        enableInjected: ops.enableInjected,
        enableCoinbase: ops.enableCoinbase
    })

    modal = createWeb3Modal({
        chains,
        ethersConfig,
        projectId: ops.projectId,
        themeMode: ops.themeMode,
        customWallets: ops.customWallets,
        allowUnsupportedChain: true,
        themeVariables: {
            '--w3m-z-index': 999999999999
        }
    })

    modal.subscribeEvents(async (event) => {
        if (event.data.event === 'SELECT_WALLET') {
            clickedAnyWallet = true
        }
        if (event.data.event === 'MODAL_CLOSE') {
            if (clickedAnyWallet) {
                clickedAnyWallet = false
            } else {
                connectRejectMethod(new Error(ErrorTypeEnum.CLOSED_WALLETCONNECT_MODAL))
            }
        }
    })

    modal.subscribeProvider(async ({ provider, chainId }) => {
        if (provider === undefined) {
            return
        }
        if (currentNetwork.chainId !== chainId) {
            await modal.switchNetwork(currentNetwork.chainId as number).catch(() => {
                connectRejectMethod(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
            })
        }
        connectResolveMethod(provider as EIP1193Provider)
    })

    return modal
}

const Web3Modal: Web3ModalAdapterInterface = {
    id: 'web3modal',
    name: 'Web3Modal',
    icon: icons.web3modal,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => {
        if (modal === undefined) {
            return false
        }
        return modal.getIsConnected()
    },
    disconnect: async () => {
        Object.keys(localStorage)
            .filter((x) => {
                return (
                    x.startsWith('wc@2') ||
                    x.startsWith('@w3m') ||
                    x.startsWith('W3M') ||
                    x.startsWith('-walletlink')
                )
            })
            .forEach((x) => {
                localStorage.removeItem(x)
            })

        if (modal?.disconnect !== undefined) {
            await modal.disconnect()
        }
    },
    connect: async (provider?: ProviderInterface, ops?: Web3ModalOps): Promise<EIP1193Provider> => {
        if (provider === undefined) {
            throw new Error('Provider is required')
        }

        if (ops === undefined) {
            throw new Error('Ops is required')
        }

        if (ops.projectId === undefined) {
            throw new Error('Project ID is required')
        }

        if (ops.metadata === undefined) {
            throw new Error('Metadata is required')
        }

        const network = provider.network as EvmNetworkConfigInterface

        currentNetwork = {
            chainId: network.id,
            name: network.name ?? network.nativeCurrency.symbol,
            currency: network.nativeCurrency.symbol,
            explorerUrl: network.explorerUrl,
            rpcUrl: network.rpcUrl
        }

        return await new Promise((resolve, reject) => {
            try {
                const modal = web3Modal(ops)
                connectRejectMethod = async (reason) => {
                    await modal.disconnect()
                    reject(reason)
                }
                connectResolveMethod = resolve
                void modal.open({ view: 'Connect' })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Web3Modal
