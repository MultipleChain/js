import type { WalletProvider } from '../Wallet'
import type { Provider } from '../../services/Provider'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { ProviderInterface, WalletAdapterInterface } from '@multiplechain/types'

import { createAppKit } from '@reown/appkit/react'
import { solana, solanaDevnet } from '@reown/appkit/networks'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import type { AppKit, EventsControllerState, Metadata, CustomWallet } from '@reown/appkit'

const icon =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKIHdpZHRoPSI0MDAuMDAwMDAwcHQiIGhlaWdodD0iNDAwLjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgNDAwLjAwMDAwMCA0MDAuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw0MDAuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNMCAyMDAwIGwwIC0yMDAwIDIwMDAgMCAyMDAwIDAgMCAyMDAwIDAgMjAwMCAtMjAwMCAwIC0yMDAwIDAgMAotMjAwMHogbTIyNjQgNzM2IGMxMjQgLTMyIDI2MSAtOTggMzYzIC0xNzUgOTEgLTY5IDE3MyAtMTUzIDE3MyAtMTc4IDAgLTE3Ci0xODcgLTIwMiAtMjA1IC0yMDMgLTYgMCAtMzEgMjEgLTU1IDQ2IC0yMjcgMjM0IC01NjkgMjk5IC04NTcgMTY0IC03OSAtMzYKLTEzMSAtNzMgLTIxMyAtMTQ5IC0zNiAtMzMgLTcyIC02MCAtODAgLTYxIC0yMCAwIC0yMDAgMTgxIC0yMDAgMjAyIDAgMjQgNDkKNzggMTM2IDE0OCAxMzYgMTA5IDI4MSAxNzkgNDQxIDIxNSAxMDYgMjMgMTE5IDI0IDI2MyAyMCAxMDQgLTMgMTU4IC0xMCAyMzQKLTI5eiBtLTEyODQgLTYwMyBjMTQgLTkgMTMwIC0xMjAgMjU4IC0yNDYgbDIzMyAtMjMxIDU3IDU1IGMzMSAyOSAxNDUgMTQxCjI1MyAyNDYgMTEwIDEwOSAyMDMgMTkzIDIxMyAxOTMgMjAgMCAzOSAtMTggNTIyIC00OTAgMyAtMiA3OCA2OCAxNjcgMTU2IDI3MAoyNjYgMzQ0IDMzNCAzNjIgMzM0IDEwIDAgNTcgLTM5IDEwNiAtODcgNjcgLTY1IDg5IC05MyA4OSAtMTEzIDAgLTIxIC02NiAtOTAKLTM0MSAtMzYwIC0xODggLTE4NCAtMzUwIC0zMzkgLTM2MCAtMzQ0IC0xMSAtNSAtMjcgLTUgLTM4IDAgLTExIDUgLTEyOCAxMTYKLTI2MSAyNDcgLTEzMyAxMzEgLTI0NSAyMzYgLTI0OCAyMzIgLTEzNiAtMTM4IC00OTAgLTQ3MyAtNTA4IC00NzkgLTI4IC0xMQotMTYgLTIyIC00NTEgNDA2IC0yMDMgMTk5IC0yODMgMjg0IC0yODMgMzAwIDAgMjggMTcxIDE5OCAyMDAgMTk4IDMgMCAxNyAtNwozMCAtMTd6Ii8+CjwvZz4KPC9zdmc+Cg=='

type EventFunction = (newEvent: EventsControllerState, appKit?: AppKit) => void

export interface Web3WalletsConfig {
    projectId: string
    metadata?: Metadata
    events?: EventFunction[]
    themeMode?: 'dark' | 'light'
    customWallets?: CustomWallet[]
}

let clickedAnyWallet = false
let web3wallets: AppKit | undefined
let connectRejectMethod: (reason?: any) => void
let connectResolveMethod: (value: WalletProvider | PromiseLike<WalletProvider>) => void

const solanaWeb3JsAdapter = new SolanaAdapter({
    wallets: []
})

const createWeb3Wallets = (config: Web3WalletsConfig): AppKit => {
    if (web3wallets !== undefined) {
        return web3wallets
    }

    web3wallets = createAppKit({
        enableEIP6963: true,
        enableInjected: true,
        adapters: [solanaWeb3JsAdapter],
        networks: [solana, solanaDevnet],
        projectId: config.projectId,
        themeMode: config.themeMode,
        metadata: config.metadata,
        customWallets: config.customWallets,
        themeVariables: {
            '--w3m-z-index': 99999
        },
        features: {
            email: false,
            socials: false
        }
    })

    if (config.events !== undefined) {
        config.events.forEach((event) => {
            web3wallets?.subscribeEvents((newEvent: EventsControllerState) => {
                event(newEvent, web3wallets)
            })
        })
    }

    web3wallets.subscribeEvents(async (event) => {
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

    web3wallets.subscribeAccount(async (account) => {
        const provider = web3wallets?.getWalletProvider() as WalletProvider | undefined
        if (account.isConnected && provider !== undefined) {
            void web3wallets?.close()
            connectResolveMethod(provider)
        }
    })

    return web3wallets
}

const Web3Wallets: WalletAdapterInterface<Provider, WalletProvider> = {
    icon,
    id: 'web3wallets',
    name: 'Web3 Wallets',
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => {
        if (web3wallets === undefined) {
            return false
        }
        return web3wallets.getIsConnectedState()
    },
    disconnect: async () => {
        Object.keys(localStorage)
            .filter((x) => {
                return (
                    x.startsWith('wc@2') ||
                    x.startsWith('@w3m') ||
                    x.startsWith('@appkit') ||
                    x.startsWith('W3M') ||
                    x.startsWith('-walletlink')
                )
            })
            .forEach((x) => {
                localStorage.removeItem(x)
            })

        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')
    },
    connect: async (
        provider?: ProviderInterface,
        _config?: Web3WalletsConfig | object
    ): Promise<WalletProvider> => {
        const config = _config as Web3WalletsConfig

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        return await new Promise((resolve, reject) => {
            try {
                const web3wallets = createWeb3Wallets(config)
                connectRejectMethod = async (reason) => {
                    reject(reason)
                }
                connectResolveMethod = resolve
                void web3wallets.open({ view: 'Connect' })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Web3Wallets
