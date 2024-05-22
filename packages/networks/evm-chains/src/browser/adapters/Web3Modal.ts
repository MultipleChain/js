import icons from './icons.ts'
import { networks } from '../../index.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import type { Provider } from '../../services/Provider.ts'
import type { Chain } from '@web3modal/scaffold-utils/ethers'
import type { CustomWallet, Metadata } from '@web3modal/core'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers'
import type { Web3Modal as Web3ModalType } from '@web3modal/ethers'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'

export interface Web3ModalOps {
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
            await modal.switchNetwork(currentNetwork.chainId).catch(() => {
                connectRejectMethod(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
            })
        }
        connectResolveMethod(provider as EIP1193Provider)
    })

    return modal
}

const Web3Modal: WalletAdapterInterface<Provider, EIP1193Provider> = {
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
    connect: async (
        provider?: Provider,
        _ops?: Web3ModalOps | object
    ): Promise<EIP1193Provider> => {
        const ops = _ops as Web3ModalOps

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (ops === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (ops.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        if (ops.metadata === undefined) {
            throw new Error(ErrorTypeEnum.METADATA_IS_REQUIRED)
        }

        const network = provider.network

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
