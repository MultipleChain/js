import icons from './icons.ts'
import type { EIP1193Provider } from './EIP6963.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import type { EvmNetworkConfigInterface } from '../../services/Provider.ts'
import type {
    WalletConnectOps,
    WalletAdapterInterface,
    ProviderInterface
} from '@multiplechain/types'

let isConnected = false

const WalletConnect: WalletAdapterInterface = {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: icons.walletConnect,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => isConnected,
    disconnect: () => {
        isConnected = false
        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')
    },
    connect: async (
        provider?: ProviderInterface,
        _ops?: WalletConnectOps | object
    ): Promise<EIP1193Provider> => {
        const ops = _ops as WalletConnectOps

        if (provider === undefined) {
            throw new Error('Provider is required')
        }

        if (ops === undefined) {
            throw new Error('Ops is required')
        }

        if (ops.projectId === undefined) {
            throw new Error('Project ID is required')
        }

        const rpcIdMapping = {}
        const network = provider.network as EvmNetworkConfigInterface
        // @ts-expect-error allow number index
        rpcIdMapping[network.id] = network.rpcUrl

        const connector = await EthereumProvider.init({
            projectId: ops.projectId,
            relayUrl: 'wss://relay.walletconnect.com',
            optionalChains: [network.id],
            rpcMap: rpcIdMapping,
            chains: [network.id],
            showQrModal: true,
            qrModalOptions: {
                themeMode: ops.themeMode,
                themeVariables: {
                    '--wcm-z-index': '999999999999'
                },
                explorerExcludedWalletIds: 'ALL',
                explorerRecommendedWalletIds: [
                    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
                    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
                    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
                    '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
                    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709',
                    'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a',
                    'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18',
                    'ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef',
                    'bc949c5d968ae81310268bf9193f9c9fb7bb4e1283e1284af8f2bd4992535fd6',
                    '74f8092562bd79675e276d8b2062a83601a4106d30202f2d509195e30e19673d',
                    'afbd95522f4041c71dd4f1a065f971fd32372865b416f95a0b1db759ae33f2a7',
                    '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66',
                    '8837dd9413b1d9b585ee937d27a816590248386d9dbf59f5cd3422dbbb65683e',
                    'c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576',
                    '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662',
                    '85db431492aa2e8672e93f4ea7acf10c88b97b867b0d373107af63dc4880f041'
                ]
            }
        })

        return await new Promise((resolve, reject) => {
            connector
                .enable()
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
