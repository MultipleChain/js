import icons from './icons'
import { networks } from '../../index'
import type { EIP1193Provider } from './EIP6963'
import type { Provider } from '../../services/Provider'
import type { Chain } from '@web3modal/scaffold-utils/ethers'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers'
import type { Web3Modal as Web3ModalType } from '@web3modal/ethers'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { CustomWallet, EventsControllerState, Metadata } from '@web3modal/core'

type EventFunction = (newEvent: EventsControllerState, modal?: Web3ModalType) => void

export interface Web3ModalConfig {
    projectId: string
    themeMode?: 'dark' | 'light'
    enableEIP6963?: boolean
    enableInjected?: boolean
    enableCoinbase?: boolean
    rpcUrl?: string
    defaultChainId?: number
    metadata: Metadata
    customWallets?: CustomWallet[]
    events?: EventFunction[]
}

export interface Web3ModalAdapterInterface
    extends WalletAdapterInterface<Provider, EIP1193Provider> {
    modal?: Web3ModalType
}

let modal: Web3ModalType | undefined
let walletProvider: EIP1193Provider | undefined

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

const web3Modal = (config: Web3ModalConfig): Web3ModalType => {
    if (modal !== undefined) {
        return modal
    }

    const ethersConfig = defaultConfig({
        metadata: config.metadata,
        enableEIP6963: config.enableEIP6963,
        enableInjected: config.enableInjected,
        enableCoinbase: config.enableCoinbase
    })

    modal = createWeb3Modal({
        chains,
        ethersConfig,
        projectId: config.projectId,
        themeMode: config.themeMode,
        customWallets: config.customWallets,
        allowUnsupportedChain: true,
        themeVariables: {
            '--w3m-z-index': 999999999999
        }
    })

    if (config.events !== undefined) {
        config.events.forEach((event) => {
            modal?.subscribeEvents((newEvent: EventsControllerState) => {
                event(newEvent, modal)
            })
        })
    }

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
            await modal?.switchNetwork(currentNetwork.chainId).catch(() => {
                connectRejectMethod(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
            })
        }

        connectResolveMethod((walletProvider = provider as EIP1193Provider))
    })

    return modal
}

const Web3Modal: Web3ModalAdapterInterface = {
    modal,
    id: 'web3modal',
    name: 'Web3Modal',
    icon: icons.web3modal,
    provider: walletProvider,
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
        _config?: Web3ModalConfig | object
    ): Promise<EIP1193Provider> => {
        const config = _config as Web3ModalConfig

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        if (config.metadata === undefined) {
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
                const modal = web3Modal(config)
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
