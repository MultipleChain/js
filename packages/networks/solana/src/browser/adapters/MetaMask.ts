import type { WalletProvider } from '../Wallet'
import { base58Encode } from '@multiplechain/utils'
import type { Provider } from '../../services/Provider'
import { PublicKey, type Transaction } from '@solana/web3.js'
import type { WalletAdapterInterface } from '@multiplechain/types'
import { getWalletStandard } from '@metamask/solana-wallet-standard'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import { getDefaultTransport, getMultichainClient } from '@metamask/multichain-api-client'

const metamaskAdapter = getWalletStandard({
    client: getMultichainClient({ transport: getDefaultTransport() }),
    walletName: 'MetaMask'
})

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean
        }
    }
}

const MetaMask: WalletAdapterInterface<Provider, WalletProvider> = {
    id: 'metamask',
    name: 'MetaMask',
    icon: metamaskAdapter.icon,
    downloadLink: 'https://metamask.io/download/',
    platforms: [WalletPlatformEnum.BROWSER],
    isDetected: () => {
        return Boolean(window?.ethereum?.isMetaMask)
    },
    createDeepLink: (url: string): string => `https://metamask.app.link/dapp/${url}`,
    isConnected: async () => {
        return Boolean(metamaskAdapter.accounts.length)
    },
    disconnect: async () => {
        try {
            await metamaskAdapter.features['standard:disconnect'].disconnect()
        } catch (error) {
            console.error('MetaMask disconnect error:', error)
        }
    },
    connect: async (provider?: Provider): Promise<WalletProvider> => {
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }
        const chain = provider.isTestnet() ? 'solana:devnet' : 'solana:mainnet'
        const metamaskProvider = {
            publicKey:
                metamaskAdapter.accounts.length > 0
                    ? new PublicKey(metamaskAdapter.accounts[0].publicKey)
                    : null,
            signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
                return (
                    await metamaskAdapter.features['solana:signMessage'].signMessage({
                        account: metamaskAdapter.accounts[0],
                        message
                    })
                )[0].signature
            },
            sendTransaction: async (transaction: Transaction): Promise<string> => {
                const [{ signature }] = await metamaskAdapter.features[
                    'solana:signAndSendTransaction'
                ].signAndSendTransaction({
                    account: metamaskAdapter.accounts[0],
                    transaction: transaction.serialize({
                        requireAllSignatures: false
                    }) as Uint8Array,
                    chain
                })
                return base58Encode(signature)
            },
            on: (event: string, callback: (...args: any[]) => void) => {
                metamaskAdapter.features['standard:events'].on(event as any, callback)
            },
            connect: async () => {
                const { accounts } = await metamaskAdapter.features['standard:connect'].connect()
                metamaskProvider.publicKey = new PublicKey(accounts[0].publicKey)
                return metamaskProvider.publicKey
            },
            disconnect: async () => {
                await metamaskAdapter.features['standard:disconnect'].disconnect()
            }
        }
        await metamaskProvider.connect()
        return metamaskProvider as any as WalletProvider
    }
}

export default MetaMask
