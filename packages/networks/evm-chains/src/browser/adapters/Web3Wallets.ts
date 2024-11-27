import icons from './icons'
import { networks } from '../../index'
import type { EIP1193Provider } from './EIP6963'
import type { Provider } from '../../services/Provider'
import type { Chain } from '@web3modal/scaffold-utils/ethers'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers'
import type { Web3Modal as Web3ModalType } from '@web3modal/ethers'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { CustomWallet, EventsControllerState, Metadata, ThemeVariables } from '@web3modal/core'

type EventFunction = (newEvent: EventsControllerState, modal?: Web3ModalType) => void

export interface Web3ModalConfig {
    projectId: string
    metadata: Metadata
    events?: EventFunction[]
    themeMode?: 'dark' | 'light'
    customWallets?: CustomWallet[]
    themeVariables?: ThemeVariables
}

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
let web3Wallets: Web3ModalType | undefined
let connectRejectMethod: (reason?: any) => void
let connectResolveMethod: (value: EIP1193Provider | PromiseLike<EIP1193Provider>) => void

const createWeb3Wallets = (config: Web3ModalConfig): Web3ModalType => {
    if (web3Wallets !== undefined) {
        return web3Wallets
    }

    const ethersConfig = defaultConfig({
        metadata: config.metadata
    })

    web3Wallets = createWeb3Modal({
        chains,
        ethersConfig,
        projectId: config.projectId,
        themeMode: config.themeMode,
        allowUnsupportedChain: true,
        customWallets: config.customWallets,
        themeVariables: config.themeVariables
    })

    if (config.events !== undefined) {
        config.events.forEach((event) => {
            web3Wallets?.subscribeEvents((newEvent: EventsControllerState) => {
                event(newEvent, web3Wallets)
            })
        })
    }

    web3Wallets.subscribeProvider(async ({ provider, chainId }) => {
        if (provider === undefined) {
            return
        }

        if (currentNetwork.chainId !== chainId) {
            await web3Wallets?.switchNetwork(currentNetwork.chainId).catch(() => {
                connectRejectMethod(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
            })
        }

        connectResolveMethod(provider as EIP1193Provider)
    })

    return web3Wallets
}

const Web3Wallets: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'web3wallets',
    name: 'Web3 Wallets',
    icon: icons.web3wallets,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => {
        if (web3Wallets === undefined) {
            return false
        }
        return web3Wallets.getIsConnected()
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

        if (web3Wallets?.disconnect !== undefined) {
            await web3Wallets.disconnect()
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
                const wallets = createWeb3Wallets(config)
                connectRejectMethod = async (reason) => {
                    await wallets.disconnect()
                    reject(reason)
                }
                connectResolveMethod = resolve
                void wallets.open({ view: 'Connect' })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Web3Wallets
