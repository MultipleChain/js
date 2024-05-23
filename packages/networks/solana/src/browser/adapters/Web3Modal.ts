import type { Metadata } from '@web3modal/core'
import type { WalletAdapter } from '../Wallet.ts'
import type { Provider } from '../../services/Provider.ts'
import { solana, solanaDevnet } from '@web3modal/solana/chains'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'
import {
    createWeb3Modal,
    defaultSolanaConfig,
    type Web3ModalOptions,
    type Web3Modal as Web3ModalType
} from '@web3modal/solana'

const icon =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKIHdpZHRoPSI0MDAuMDAwMDAwcHQiIGhlaWdodD0iNDAwLjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgNDAwLjAwMDAwMCA0MDAuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw0MDAuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNMCAyMDAwIGwwIC0yMDAwIDIwMDAgMCAyMDAwIDAgMCAyMDAwIDAgMjAwMCAtMjAwMCAwIC0yMDAwIDAgMAotMjAwMHogbTIyNjQgNzM2IGMxMjQgLTMyIDI2MSAtOTggMzYzIC0xNzUgOTEgLTY5IDE3MyAtMTUzIDE3MyAtMTc4IDAgLTE3Ci0xODcgLTIwMiAtMjA1IC0yMDMgLTYgMCAtMzEgMjEgLTU1IDQ2IC0yMjcgMjM0IC01NjkgMjk5IC04NTcgMTY0IC03OSAtMzYKLTEzMSAtNzMgLTIxMyAtMTQ5IC0zNiAtMzMgLTcyIC02MCAtODAgLTYxIC0yMCAwIC0yMDAgMTgxIC0yMDAgMjAyIDAgMjQgNDkKNzggMTM2IDE0OCAxMzYgMTA5IDI4MSAxNzkgNDQxIDIxNSAxMDYgMjMgMTE5IDI0IDI2MyAyMCAxMDQgLTMgMTU4IC0xMCAyMzQKLTI5eiBtLTEyODQgLTYwMyBjMTQgLTkgMTMwIC0xMjAgMjU4IC0yNDYgbDIzMyAtMjMxIDU3IDU1IGMzMSAyOSAxNDUgMTQxCjI1MyAyNDYgMTEwIDEwOSAyMDMgMTkzIDIxMyAxOTMgMjAgMCAzOSAtMTggNTIyIC00OTAgMyAtMiA3OCA2OCAxNjcgMTU2IDI3MAoyNjYgMzQ0IDMzNCAzNjIgMzM0IDEwIDAgNTcgLTM5IDEwNiAtODcgNjcgLTY1IDg5IC05MyA4OSAtMTEzIDAgLTIxIC02NiAtOTAKLTM0MSAtMzYwIC0xODggLTE4NCAtMzUwIC0zMzkgLTM2MCAtMzQ0IC0xMSAtNSAtMjcgLTUgLTM4IDAgLTExIDUgLTEyOCAxMTYKLTI2MSAyNDcgLTEzMyAxMzEgLTI0NSAyMzYgLTI0OCAyMzIgLTEzNiAtMTM4IC00OTAgLTQ3MyAtNTA4IC00NzkgLTI4IC0xMQotMTYgLTIyIC00NTEgNDA2IC0yMDMgMTk5IC0yODMgMjg0IC0yODMgMzAwIDAgMjggMTcxIDE5OCAyMDAgMTk4IDMgMCAxNyAtNwozMCAtMTd6Ii8+CjwvZz4KPC9zdmc+Cg=='

export interface Web3ModalConfig extends Web3ModalOptions {
    metadata: Metadata
}

export interface Web3ModalAdapterInterface
    extends Omit<WalletAdapterInterface<Provider, WalletAdapter>, 'connect'> {
    connect: (
        provider?: ProviderInterface,
        config?: Web3ModalConfig | object
    ) => Promise<BaseMessageSignerWalletAdapter>
}

interface Chain {
    rpcUrl: string
    explorerUrl: string
    currency: string
    name: string
    chainId: string
}

let modal: Web3ModalType
let currentNetwork: Chain
let clickedAnyWallet = false
let walletProvider: BaseMessageSignerWalletAdapter | undefined
let connectRejectMethod: (reason?: any) => void
let connectResolveMethod: (
    value: BaseMessageSignerWalletAdapter | PromiseLike<BaseMessageSignerWalletAdapter>
) => void

const web3Modal = (config: Web3ModalConfig): Web3ModalType => {
    if (modal !== undefined) {
        return modal
    }

    const chains = [solana, solanaDevnet]

    const solanaConfig = defaultSolanaConfig({
        chains,
        projectId: config.projectId,
        metadata: config.metadata
    })

    modal = createWeb3Modal({
        chains,
        solanaConfig,
        metadata: config.metadata,
        projectId: config.projectId,
        themeMode: config.themeMode,
        allowUnsupportedChain: true,
        defaultChain: currentNetwork,
        customWallets: config.customWallets,
        themeVariables: {
            '--w3m-z-index': 999999999999
        }
    })

    modal.subscribeEvents(async (event) => {
        if (event.data.event === 'SELECT_WALLET') {
            clickedAnyWallet = true
        }
        if (event.data.event === 'MODAL_CLOSE') {
            if (clickedAnyWallet) {
                clickedAnyWallet = false
            } else {
                connectRejectMethod(new Error(ErrorTypeEnum.CLOSED_WALLETCONNECT_MODAL))
            }
        }
    })

    modal.subscribeProvider(async (ctx) => {
        if (ctx.provider === undefined) {
            return
        }

        if (`solana:${currentNetwork.chainId}` !== ctx.caipChainId) {
            await modal
                .switchNetwork({
                    id: `solana:${currentNetwork.chainId}`,
                    name: currentNetwork.name
                })
                .catch(() => {
                    connectRejectMethod(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
                })
        }

        if (ctx.provider !== undefined && ctx.provider.on === undefined) {
            ctx.provider.on = (_eventName: string, _callback: (...args: any[]) => void): void => {
                // WalletConnectProvider does not have an on method
            }
        }

        // @ts-expect-error this provider methods enought for our needs
        connectResolveMethod((walletProvider = ctx.provider as BaseMessageSignerWalletAdapter))
    })

    return modal
}

const Web3Modal: Web3ModalAdapterInterface = {
    icon,
    id: 'web3modal',
    name: 'Web3Modal',
    provider: walletProvider,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => {
        if (modal === undefined) {
            return false
        }

        return modal.getAddress() !== undefined
    },
    disconnect: async () => {
        Object.keys(localStorage)
            .filter((x) => {
                return (
                    x.startsWith('wc@2') ||
                    x.startsWith('@w3m') ||
                    x.startsWith('W3M') ||
                    x.startsWith('-walletlink')
                )
            })
            .forEach((x) => {
                localStorage.removeItem(x)
            })

        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')

        if (modal?.disconnect !== undefined) {
            modal.disconnect()
        }
    },
    connect: async (
        provider?: ProviderInterface,
        _config?: Web3ModalConfig | object
    ): Promise<BaseMessageSignerWalletAdapter> => {
        const config = _config as Web3ModalConfig

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        if (config.metadata === undefined) {
            throw new Error(ErrorTypeEnum.METADATA_IS_REQUIRED)
        }

        currentNetwork = provider.isTestnet() ? solanaDevnet : solana

        return await new Promise((resolve, reject) => {
            try {
                const modal = web3Modal(config)
                connectRejectMethod = async (reason) => {
                    modal.disconnect()
                    reject(reason)
                }
                connectResolveMethod = resolve
                void modal.open({ view: 'Connect' })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Web3Modal
