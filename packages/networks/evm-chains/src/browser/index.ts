import { Wallet } from './Wallet'
import { switcher } from './adapters/switcher'
import * as adapterList from './adapters/index'
import { WalletPlatformEnum } from '@multiplechain/types'
import type { EIP6963ProviderDetail, EIP1193Provider } from './adapters/EIP6963'
import type {
    WalletAdapterInterface,
    WalletAdapterListType,
    RegisterWalletAdapterType
} from '@multiplechain/types'
import type { Provider } from '../services/Provider'

const EIP6963AdapterUUIDIndex: Record<string, string> = {
    'app.phantom': 'phantom',
    'io.metamask': 'metamask',
    'com.bitget.web3': 'bitgetwallet',
    'com.okex.wallet': 'okxwallet',
    'com.trustwallet.app': 'trustwallet',
    'io.xdefi': 'xdefiwallet'
}

const adapters: WalletAdapterListType<Provider, EIP1193Provider> = {}

const registerAdapter: RegisterWalletAdapterType<Provider, EIP1193Provider> = (
    adapter: WalletAdapterInterface<Provider, EIP1193Provider>
): void => {
    if (EIP6963AdapterUUIDIndex[adapter.id] !== undefined) {
        console.warn(
            `Adapter is not registered, because it is already registered default: ${adapter.id}`
        )
        return
    }

    if (Object.values(adapters).find((a) => a.id === adapter.id) !== undefined) {
        throw new Error(`Adapter with id ${adapter.id} already exists`)
    }

    adapters[adapter.id] = adapter
}

const fromEIP6963ProviderDetail = (
    detail: EIP6963ProviderDetail
): WalletAdapterInterface<Provider, EIP1193Provider> => {
    return {
        name: detail.info.name,
        icon: detail.info.icon,
        id: detail.info.rdns ?? detail.info.uuid,
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

export * from '../index'

export const browser = {
    Wallet,
    switcher,
    registerAdapter,
    fromEIP6963ProviderDetail,
    adapters: Object.assign(adapters, adapterList)
}
