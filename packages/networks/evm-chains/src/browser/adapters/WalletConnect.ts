import icons from './icons'
import { networks } from '../../index'
import type { EIP1193Provider } from './EIP6963'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { EvmNetworkConfigInterface, Provider } from '../../services/Provider'
import type { WalletConnectConfig, WalletAdapterInterface } from '@multiplechain/types'

let isConnected = false
let connector: InstanceType<typeof EthereumProvider> | undefined

const initConnector = async (
    config: WalletConnectConfig,
    network: EvmNetworkConfigInterface
): Promise<InstanceType<typeof EthereumProvider>> => {
    if (connector !== undefined) {
        return connector
    }

    const otherNetworkIds = networks
        .getAll()
        .map((x) => x.id)
        .filter((id) => id !== network.id)

    const chains: [number, ...number[]] = [network.id, ...otherNetworkIds]

    connector = await EthereumProvider.init({
        chains,
        projectId: config.projectId,
        optionalChains: chains,
        showQrModal: true,
        qrModalOptions: {
            themeMode: config.themeMode,
            themeVariables: {
                '--wcm-z-index': '999999999999'
            }
        }
    })

    return connector
}

const WalletConnect: WalletAdapterInterface<Provider, EIP1193Provider> = {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: icons.walletConnect,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => isConnected,
    disconnect: () => {
        isConnected = false
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

        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')
    },
    connect: async (
        provider?: Provider,
        config?: WalletConnectConfig
    ): Promise<EIP1193Provider> => {
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        const rpcIdMapping = {}
        const network = provider.network
        // @ts-expect-error allow number index
        rpcIdMapping[network.id] = network.rpcUrl
        const connector = await initConnector(config, network)

        return await new Promise((resolve, reject) => {
            connector
                .connect({
                    rpcMap: rpcIdMapping,
                    chains: [network.id],
                    optionalChains: [network.id]
                })
                .then(() => {
                    isConnected = true
                    resolve(connector as EIP1193Provider)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }
}

export default WalletConnect
