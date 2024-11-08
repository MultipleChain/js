import icons from './icons'
import { switcher } from './switcher'
import { networks } from '../../index'
import type { EIP1193Provider } from './EIP6963'
import { mainnet } from '@reown/appkit/networks'
import type { WalletAdapterInterface } from '@multiplechain/types'
import type { AppKitNetwork, CaipNetwork } from '@reown/appkit-common'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { EvmNetworkConfigInterface, Provider } from '../../services/Provider'
import type { AppKit, EventsControllerState, CustomWallet, Metadata } from '@reown/appkit'

type EventFunction = (newEvent: EventsControllerState, appKit?: AppKit) => void

export interface Web3WalletsConfig {
    projectId: string
    metadata?: Metadata
    events?: EventFunction[]
    themeMode?: 'dark' | 'light'
    customWallets?: CustomWallet[]
}

let web3wallets: AppKit | undefined

const ourFormatToAppKitFormat = (network: EvmNetworkConfigInterface): AppKitNetwork => {
    return {
        id: network.id,
        testnet: network.testnet,
        name: network.name ?? network.nativeCurrency.symbol,
        nativeCurrency: {
            symbol: network.nativeCurrency.symbol,
            decimals: network.nativeCurrency.decimals,
            name: network.nativeCurrency.name ?? network.nativeCurrency.symbol
        },
        blockExplorers: {
            default: {
                name: network.explorerUrl,
                url: network.explorerUrl,
                apiUrl: network.explorerUrl
            }
        },
        rpcUrls: {
            default: {
                http: [network.rpcUrl]
            }
        }
    }
}

const formattedNetworks: AppKitNetwork[] = networks
    .getAll()
    .map((network: EvmNetworkConfigInterface): AppKitNetwork => {
        return ourFormatToAppKitFormat(network)
    })
    .filter((network: any) => network)

let connectRejectMethod: (reason?: any) => void
let connectResolveMethod: (value: EIP1193Provider | PromiseLike<EIP1193Provider>) => void

const createWeb3Wallets = async (
    config: Web3WalletsConfig,
    networkProvider: Provider
): Promise<AppKit> => {
    if (web3wallets !== undefined) {
        return web3wallets
    }

    const { createAppKit } = await import('@reown/appkit')
    const { EthersAdapter } = await import('@reown/appkit-adapter-ethers')

    web3wallets = createAppKit({
        adapters: [new EthersAdapter()],
        projectId: config.projectId,
        themeMode: config.themeMode,
        metadata: config.metadata,
        customWallets: config.customWallets,
        networks: [mainnet, ...formattedNetworks],
        themeVariables: {
            '--w3m-z-index': 99999
        },
        features: {
            email: false,
            socials: false
        }
    })

    if (config.events !== undefined) {
        config.events.forEach((event) => {
            web3wallets?.subscribeEvents((newEvent: EventsControllerState) => {
                event(newEvent, web3wallets)
            })
        })
    }

    web3wallets.subscribeAccount(async (account) => {
        const walletProvider = web3wallets?.getWalletProvider() as EIP1193Provider | undefined
        if (account.isConnected && walletProvider !== undefined) {
            switcher(walletProvider, networkProvider)
                .then(() => {
                    connectResolveMethod(walletProvider)
                })
                .catch((error: any) => {
                    connectRejectMethod(error)
                })
        }
    })

    return web3wallets
}

const Web3Wallets: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'web3wallets',
    name: 'Web3 Wallets',
    icon: icons.web3wallets,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => {
        if (web3wallets === undefined) {
            return false
        }
        return web3wallets.getIsConnectedState()
    },
    disconnect: async () => {
        Object.keys(localStorage)
            .filter((x) => {
                return (
                    x.startsWith('wc@2') ||
                    x.startsWith('@w3m') ||
                    x.startsWith('@appkit') ||
                    x.startsWith('W3M') ||
                    x.startsWith('-walletlink')
                )
            })
            .forEach((x) => {
                localStorage.removeItem(x)
            })

        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')

        if (web3wallets?.resetWcConnection !== undefined) {
            web3wallets.resetWcConnection()
        }
    },
    connect: async (
        provider?: Provider,
        _config?: Web3WalletsConfig | object
    ): Promise<EIP1193Provider> => {
        const config = _config as Web3WalletsConfig

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        const network = ourFormatToAppKitFormat(provider.network)
        formattedNetworks.push(network)

        return await new Promise((resolve, reject) => {
            try {
                const run = async (): Promise<void> => {
                    const web3wallets = await createWeb3Wallets(config, provider)
                    web3wallets.setCaipNetwork(network as CaipNetwork)
                    connectRejectMethod = async (reason) => {
                        reject(reason)
                    }
                    connectResolveMethod = resolve
                    void web3wallets.open({ view: 'Connect' })
                }

                void run()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Web3Wallets
