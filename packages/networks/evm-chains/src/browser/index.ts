import { Wallet } from './Wallet.ts'
import { switcher } from './adapters/switcher.ts'
import * as adapterList from './adapters/index.ts'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { EIP6963ProviderDetail, EIP1193Provider } from './adapters/EIP6963.ts'
import type {
    WalletAdapterListType,
    WalletAdapterInterface,
    RegisterWalletAdapterType
} from '@multiplechain/types'

const adapters: WalletAdapterListType = {
    ...adapterList
}

const registerAdapter: RegisterWalletAdapterType = (adapter: WalletAdapterInterface): void => {
    if (Object.values(adapters).find((a) => a.id === adapter.id) !== undefined) {
        throw new Error(`Adapter with id ${adapter.id} already exists`)
    }

    adapters[adapter.id] = adapter
}

const fromEIP6963ProviderDetail = (detail: EIP6963ProviderDetail): WalletAdapterInterface => {
    return {
        id: detail.info.uuid,
        name: detail.info.name,
        icon: detail.info.icon,
        provider: detail.provider,
        platforms: [WalletPlatformEnum.BROWSER, WalletPlatformEnum.MOBILE],
        isDetected: () => true,
        isConnected: async () => {
            return Boolean((await detail.provider.request({ method: 'eth_accounts' })).length)
        },
        connect: async (): Promise<EIP1193Provider> => {
            return await new Promise((resolve, reject) => {
                try {
                    detail.provider
                        .request({ method: 'eth_requestAccounts' })
                        .then(() => {
                            resolve(detail.provider)
                        })
                        .catch((error: any) => {
                            reject(error)
                        })
                } catch (error) {
                    reject(error)
                }
            })
        }
    }
}

const toEIP6963ProviderDetail = (adapter: WalletAdapterInterface): EIP6963ProviderDetail => {
    return {
        info: {
            uuid: adapter.id,
            name: adapter.name,
            icon: adapter.icon
        },
        provider: adapter.provider
    }
}

export * from '../index.ts'

export const browser = {
    Wallet,
    switcher,
    adapters,
    registerAdapter,
    toEIP6963ProviderDetail,
    fromEIP6963ProviderDetail
}
