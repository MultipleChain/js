import { Wallet } from './Wallet.ts'
import * as adapterList from './adapters/index.ts'
import type { Provider } from '../services/Provider.ts'
import type {
    WalletAdapterListType,
    WalletAdapterInterface,
    RegisterWalletAdapterType
} from '@multiplechain/types'

const adapters: WalletAdapterListType<Provider, object> = {}

const registerAdapter: RegisterWalletAdapterType<Provider, object> = (
    adapter: WalletAdapterInterface<Provider, object>
): void => {
    if (Object.values(adapters).find((a) => a.id === adapter.id) !== undefined) {
        throw new Error(`Adapter with id ${adapter.id} already exists`)
    }

    adapters[adapter.id] = adapter
}

export * from '../index.ts'

export const browser = {
    Wallet,
    registerAdapter,
    adapters: Object.assign(adapters, adapterList)
}
