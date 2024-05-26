// eslint-disable-next-line filenames/match-exported
import BaseWrapper from '../index'
import type {
    WalletInterface,
    ProviderInterface,
    WalletAdapterListType,
    RegisterWalletAdapterType,
    TransactionSignerInterface
} from '@multiplechain/types'

export interface BrowserType<AdapterList = unknown, WalletProvider = unknown> {
    Wallet: WalletInterface<
        ProviderInterface,
        WalletProvider,
        TransactionSignerInterface<unknown, unknown>
    >
    switcher?: (wallet: WalletProvider, provider?: ProviderInterface) => Promise<boolean>
    registerAdapter: RegisterWalletAdapterType<ProviderInterface, WalletProvider>
    adapters: WalletAdapterListType<ProviderInterface, WalletProvider> & AdapterList
}

export default class Wrapper<
    T extends Record<string, any>,
    BrowserType = T[keyof T]['browser']
> extends BaseWrapper<T> {
    get browser(): BrowserType {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.browser
    }
}
