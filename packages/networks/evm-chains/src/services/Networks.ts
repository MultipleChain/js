import * as wagmiChains from '@wagmi/chains'
import type { EvmNetworkConfigInterface } from './Provider.ts'

const networks: Record<string, EvmNetworkConfigInterface> = {}

Object.keys(wagmiChains).forEach((key) => {
    const wagmiChain: wagmiChains.Chain = wagmiChains[key as keyof typeof wagmiChains]

    let backupRpcUrl = ''
    if (wagmiChain.rpcUrls?.infura !== undefined) {
        backupRpcUrl = wagmiChain.rpcUrls.infura.http[0]
    } else if (wagmiChain.rpcUrls?.alchemy !== undefined) {
        backupRpcUrl = wagmiChain.rpcUrls.alchemy.http[0]
    }

    const network: EvmNetworkConfigInterface = {
        id: wagmiChain.id,
        name: wagmiChain.name,
        testnet: wagmiChain.testnet ?? false,
        nativeCurrency: wagmiChain.nativeCurrency,
        hexId: '0x' + Number(wagmiChain.id).toString(16),
        explorerUrl: wagmiChain.blockExplorers?.default.url ?? '',
        rpcUrl: wagmiChain.rpcUrls?.default.http[0] ?? backupRpcUrl
    }

    if (wagmiChain.rpcUrls?.default.webSocket !== undefined) {
        network.wsUrl = wagmiChain.rpcUrls.default.webSocket[0]
    }

    if (wagmiChain.rpcUrls?.infura?.webSocket !== undefined && network.wsUrl === undefined) {
        network.wsUrl = wagmiChain.rpcUrls.infura.webSocket[0]
    }

    if (wagmiChain.rpcUrls?.alchemy?.webSocket !== undefined && network.wsUrl === undefined) {
        network.wsUrl = wagmiChain.rpcUrls.alchemy.webSocket[0]
    }

    if (network.wsUrl === undefined) {
        delete network.wsUrl
    }

    networks[key === 'mainnet' ? 'ethereum' : key] = network
})

const findById = (id: number): EvmNetworkConfigInterface | undefined => {
    return Object.values(networks).find((network) => network.id === id)
}

const findByKey = (key: string): EvmNetworkConfigInterface | undefined => {
    return networks[key]
}

const findByName = (name: string): EvmNetworkConfigInterface | undefined => {
    return Object.values(networks).find((network) => network.name?.includes(name))
}

const findByHexId = (hexId: string): EvmNetworkConfigInterface | undefined => {
    return Object.values(networks).find((network) => network.hexId === hexId)
}

const findBySymbol = (symbol: string): EvmNetworkConfigInterface | undefined => {
    return Object.values(networks).find((network) => network.nativeCurrency.symbol === symbol)
}

const getTestnets = (): EvmNetworkConfigInterface[] => {
    return Object.values(networks).filter((network) => network.testnet ?? false)
}

const getMainnets = (): EvmNetworkConfigInterface[] => {
    return Object.values(networks).filter((network) => !(network.testnet ?? false))
}

export default {
    findById,
    findByKey,
    findByName,
    findByHexId,
    findBySymbol,
    getTestnets,
    getMainnets,
    ...networks
}
