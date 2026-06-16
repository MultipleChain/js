import { martian } from './icons'
import { toBase64 } from '@mysten/sui/utils'
import type { WalletProvider } from '../Wallet'
import { WalletAdapter } from '@suiet/wallet-sdk'
import type { Provider } from '../../services/Provider'
import { adapterToProvider, getWalletByName } from './standard'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type {
    SuiSignAndExecuteTransactionOutput,
    SuiSignTransactionInput
} from '@mysten/wallet-standard'

declare global {
    interface Window {
        martian: {
            sui: {
                signTransactionBlock: (input: {
                    transactionBlockSerialized: string
                    options?: {
                        showEffects?: boolean
                        showRawEffects?: boolean
                    }
                }) => Promise<{
                    transactionBlockBytes: string
                    signature: string
                }>
                signAndExecuteTransactionBlock: (input: {
                    transactionBlockSerialized: string
                    options?: {
                        showEffects?: boolean
                        showRawEffects?: boolean
                    }
                }) => Promise<{
                    digest: string
                    rawEffects: number[]
                }>
            }
        }
    }
}

interface ExtendedSuiSignTransactionInput extends SuiSignTransactionInput {
    transaction: {
        serialize: () => string
        toJSON: () => Promise<string>
    }
}

const Martian: WalletAdapterInterface<Provider, WalletProvider> = {
    icon: martian,
    id: 'martian',
    name: 'Martian',
    platforms: [WalletPlatformEnum.BROWSER],
    downloadLink: 'https://martianwallet.xyz/',
    isDetected: () => Boolean(window.martian?.sui),
    isConnected: () => Boolean(getWalletByName('Martian Sui Wallet')?.accounts.length),
    disconnect: async () => {
        const wallet = getWalletByName('Martian Sui Wallet')
        try {
            if (wallet) {
                await new WalletAdapter(wallet).disconnect()
            }
        } catch (error) {
            console.error('Error disconnecting from Martian wallet:', error)
        }
    },
    connect: async (provider?: Provider) => {
        const wallet = getWalletByName('Martian Sui Wallet')

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (!wallet || !window.martian?.sui) {
            throw new Error(ErrorTypeEnum.WALLET_CONNECTION_FAILED)
        }

        const martian = window.martian.sui
        const adapter = new WalletAdapter(wallet)

        adapter.signAndExecuteTransaction = async (
            input: ExtendedSuiSignTransactionInput
        ): Promise<SuiSignAndExecuteTransactionOutput> => {
            const signed = await martian.signTransactionBlock({
                transactionBlockSerialized: input.transaction.serialize()
            })
            const res = await provider.client.executeTransactionBlock({
                transactionBlock: signed.transactionBlockBytes,
                signature: signed.signature,
                options: {
                    showRawEffects: true
                }
            })
            return {
                digest: res.digest,
                signature: signed.signature,
                bytes: signed.transactionBlockBytes,
                effects: toBase64(new Uint8Array(res.rawEffects ?? []))
            }
        }

        return await new Promise((resolve, reject) => {
            adapter
                .connect({})
                .then(() => {
                    resolve(adapterToProvider(adapter, provider))
                })
                .catch(reject)
        })
    }
}

export default Martian
