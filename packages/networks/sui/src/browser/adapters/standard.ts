import type { WalletProvider } from '../Wallet'
import type { WalletAdapter } from '@suiet/wallet-sdk'
import type { Provider } from '../../services/Provider'
import type { Transaction } from '@mysten/sui/transactions'
import { getWallets, type StandardEventsNames, type Wallet } from '@mysten/wallet-standard'

export interface BasicAccount {
    address: string
    publicKey: Uint8Array
}

export const getWalletByName = (name: string): Wallet | undefined => {
    return Object.values(getWallets().get()).find((adapter) => adapter.name === name)
}

export const adapterToProvider = (
    adapter: WalletAdapter,
    provider: Provider,
    account?: BasicAccount
): WalletProvider => {
    const network = provider?.isTestnet() ? 'devnet' : 'mainnet'
    return {
        getAddress: async (): Promise<string> => {
            return account ? account.address : adapter.accounts[0].address
        },
        signMessage: async (message: string): Promise<string> => {
            const res = await adapter.signMessage({
                message: new TextEncoder().encode(message),
                account: adapter.accounts[0]
            })
            return res.signature
        },
        sendTransaction: async (transaction: Transaction): Promise<string> => {
            const res = await adapter.signAndExecuteTransaction({
                transaction,
                chain: `sui:${network}`,
                account: adapter.accounts[0]
            })
            return res.digest
        },
        on: (event: string, callback: (data: any) => void) => {
            adapter.on(event as StandardEventsNames, callback)
        }
    }
}
