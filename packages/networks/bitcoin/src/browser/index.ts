import type { Provider } from 'sats-connect'
import { Wallet, type BitcoinWalletAdapter } from './Wallet.ts'
import * as adapterList from './adapters/index.ts'
import type {
    WalletAdapterListType,
    WalletAdapterInterface,
    RegisterWalletAdapterType
} from '@multiplechain/types'

const adapters: WalletAdapterListType<Provider, BitcoinWalletAdapter> = {}

const registerAdapter: RegisterWalletAdapterType<Provider, BitcoinWalletAdapter> = (
    adapter: WalletAdapterInterface<Provider, BitcoinWalletAdapter>
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
