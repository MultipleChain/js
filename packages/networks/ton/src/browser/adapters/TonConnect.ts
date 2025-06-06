import { TonConnectIcon } from './icons'
import { THEME, TonConnectUI } from '@tonconnect/ui'
import type { Provider } from '../../services/Provider'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { ConnectConfig, WalletAdapterInterface } from '@multiplechain/types'

export type TonConnectConfig = ConnectConfig & {
    manifestUrl?: string
    buttonRootId?: string
    themeMode?: string
}

let ui: TonConnectUI
let rejectedAction: (reason?: any) => void
let connectedAction: (value: TonConnectUI | PromiseLike<TonConnectUI>) => void

const createUI = (config?: TonConnectConfig): TonConnectUI => {
    if (ui) {
        return ui
    }

    ui = new TonConnectUI({
        uiPreferences: {
            theme: config?.themeMode === 'light' ? THEME.LIGHT : THEME.DARK
        },
        manifestUrl: config?.manifestUrl,
        buttonRootId: config?.buttonRootId
    })

    ui.onStatusChange((status) => {
        if (status && ui.connected) {
            ui.closeModal()
            connectedAction(ui)
        }
    })

    ui.onModalStateChange((state) => {
        if (state.status === 'closed' && state.closeReason === 'action-cancelled') {
            rejectedAction(ErrorTypeEnum.CLOSED_WALLETCONNECT_MODAL)
        }
    })

    return ui
}

const TonConnect: WalletAdapterInterface<Provider, TonConnectUI> = {
    id: 'ton-connect',
    name: 'TON Connect',
    icon: TonConnectIcon,
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: async () => {
        return ui?.connected ?? false
    },
    disconnect: async () => {
        try {
            if (ui) {
                await ui.disconnect()
            }
        } catch (error) {
            console.error(error)
        }
    },
    connect: async (provider?: Provider, _config?: ConnectConfig) => {
        const config = _config as TonConnectConfig
        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (!config.manifestUrl) {
            throw new Error('Manifest URL is required')
        }

        return await new Promise((resolve, reject) => {
            try {
                connectedAction = resolve
                rejectedAction = reject
                void createUI(config).openModal()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default TonConnect
