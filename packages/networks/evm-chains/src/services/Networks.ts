import * as allEvmChains from 'viem/chains'
import type { EvmNetworkConfigInterface } from './Provider'
const networks: Record<string, EvmNetworkConfigInterface> = {}

for (const key of Object.keys(allEvmChains)) {
    const chain: allEvmChains.Chain = allEvmChains[key as keyof typeof allEvmChains]

    if (chain.id === undefined) {
        continue
    }

    let backupRpcUrl = ''
    if (chain.rpcUrls?.infura !== undefined) {
        backupRpcUrl = chain.rpcUrls.infura.http[0]
    } else if (chain.rpcUrls?.alchemy !== undefined) {
        backupRpcUrl = chain.rpcUrls.alchemy.http[0]
    }

    const network: EvmNetworkConfigInterface = {
        id: chain.id,
        name: chain.name,
        testnet: chain.testnet ?? false,
        nativeCurrency: chain.nativeCurrency,
        hexId: '0x' + Number(chain.id).toString(16),
        explorerUrl: chain.blockExplorers?.default.url ?? '',
        rpcUrl: chain.rpcUrls?.default.http[0] ?? backupRpcUrl
    }

    if (chain.rpcUrls?.default.webSocket !== undefined) {
        network.wsUrl = chain.rpcUrls.default.webSocket[0]
    }

    if (chain.rpcUrls?.infura?.webSocket !== undefined && network.wsUrl === undefined) {
        network.wsUrl = chain.rpcUrls.infura.webSocket[0]
    }

    if (chain.rpcUrls?.alchemy?.webSocket !== undefined && network.wsUrl === undefined) {
        network.wsUrl = chain.rpcUrls.alchemy.webSocket[0]
    }

    if (network.wsUrl === undefined) {
        delete network.wsUrl
    }

    networks[key === 'mainnet' ? 'ethereum' : key] = network
}

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

const getAll = (): EvmNetworkConfigInterface[] => {
    return Object.values(networks)
}

const add = (key: string, network: EvmNetworkConfigInterface): void => {
    networks[key] = network
}

export default {
    add,
    getAll,
    findById,
    findByKey,
    findByName,
    findByHexId,
    findBySymbol,
    getTestnets,
    getMainnets,
    ...networks
}
