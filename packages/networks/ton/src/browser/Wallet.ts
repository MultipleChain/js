import { Provider } from '../services/Provider'
import { CHAIN, type TonConnectUI } from '@tonconnect/ui'
import type { TransactionSigner } from '../services/TransactionSigner'
import { Address, Cell, type CommonMessageInfoRelaxedInternal } from '@ton/core'
import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    type TransactionId,
    type SignedMessage,
    type WalletAddress,
    type ConnectConfig,
    type UnknownConfig,
    ErrorTypeEnum
} from '@multiplechain/types'

type WalletAdapter = WalletAdapterInterface<Provider, TonConnectUI>

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain TON Connect Error:', error)
    const errorMessage = String(error.message ?? '')
    if (errorMessage.includes('Reject request')) {
        return reject(ErrorTypeEnum.WALLET_REQUEST_REJECTED)
    }
    return reject(error)
}

export class Wallet implements WalletInterface<Provider, TonConnectUI, TransactionSigner> {
    /**
     * WalletAdapter instance
     */
    adapter: WalletAdapter

    /**
     * Wallet provider is the instance of the wallet connection
     */
    walletProvider: TonConnectUI

    /**
     * Network provider is the instance of the blockchain network connection
     */
    networkProvider: Provider

    /**
     * @param adapter - WalletAdapter instance
     * @param provider - Network provider
     */
    constructor(adapter: WalletAdapter, provider?: Provider) {
        this.adapter = adapter
        this.networkProvider = provider ?? Provider.instance
    }

    /**
     * @returns wallet id
     */
    getId(): string {
        return this.adapter.id
    }

    /**
     * @returns wallet name
     */
    getName(): string {
        return this.adapter.name
    }

    /**
     * @returns wallet icon
     */
    getIcon(): string {
        return this.adapter.icon
    }

    /**
     * @returns wallet platforms
     */
    getPlatforms(): WalletPlatformEnum[] {
        return this.adapter.platforms
    }

    /**
     * @returns wallet download link
     */
    getDownloadLink(): string | undefined {
        return this.adapter.downloadLink
    }

    /**
     * @param url - URL to create a deep link
     * @param config - Configuration for the deep link
     * @returns deep link
     */
    createDeepLink(url: string, config?: UnknownConfig): string | null {
        if (this.adapter.createDeepLink === undefined) {
            return null
        }

        return this.adapter.createDeepLink(url, config)
    }

    /**
     * @param config - Configuration for the connection
     * @returns wallet address
     */
    async connect(config?: ConnectConfig): Promise<WalletAddress> {
        return await new Promise((resolve, reject) => {
            this.adapter
                .connect(this.networkProvider, config)
                .then(async (provider) => {
                    this.walletProvider = provider
                    resolve(await this.getAddress())
                })
                .catch((error) => {
                    const customReject = (error: any): void => {
                        if (error.message === ErrorTypeEnum.WALLET_REQUEST_REJECTED) {
                            reject(new Error(ErrorTypeEnum.WALLET_CONNECT_REJECTED))
                        } else {
                            reject(error)
                        }
                    }
                    rejectMap(error, customReject)
                })
        })
    }

    /**
     * @returns wallet detected status
     */
    async isDetected(): Promise<boolean> {
        return await this.adapter.isDetected()
    }

    /**
     * @returns wallet connected status
     */
    async isConnected(): Promise<boolean> {
        return await this.adapter.isConnected()
    }

    /**
     * @returns wallet address
     */
    async getAddress(): Promise<WalletAddress> {
        const account = this.walletProvider.account
        return Address.parse(this.getRawAddress()).toString({
            testOnly: account?.chain === CHAIN.TESTNET,
            bounceable: false
        })
    }

    getRawAddress(): string {
        return this.walletProvider.account?.address ?? ''
    }

    /**
     * @param _message - Message to sign
     * @returns signed message
     */
    async signMessage(_message: string): Promise<SignedMessage> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param transactionSigner - Transaction signer
     * @param modalAction - Modal action
     * @param modalAction.modals - Modals
     * @param modalAction.notifications - Notifications
     * @returns transaction id
     */
    async sendTransaction(
        transactionSigner: TransactionSigner,
        modalAction = {
            modals: [],
            notifications: []
        }
    ): Promise<TransactionId> {
        return await new Promise((resolve, reject) => {
            try {
                const account = this.walletProvider.account
                const messages = transactionSigner.getRawData()

                const tonConnectMessageFormat = []
                for (const message of messages) {
                    const info = message.info as CommonMessageInfoRelaxedInternal
                    tonConnectMessageFormat.push({
                        address: info.dest.toString(),
                        amount: info.value.coins.toString(),
                        payload: message.body.toBoc().toString('base64')
                    })
                }

                this.walletProvider
                    .sendTransaction(
                        {
                            validUntil: Math.floor(Date.now() / 1000) + 60,
                            from: this.getRawAddress(),
                            network: account?.chain,
                            messages: tonConnectMessageFormat
                        },
                        modalAction
                    )
                    .then(async (result) => {
                        const messageHash = Cell.fromBase64(result.boc).hash().toString('hex')
                        resolve(await this.networkProvider.findTxHashByMessageHash(messageHash))
                    })
                    .catch((error) => {
                        rejectMap(error, reject)
                    })
            } catch (error) {
                rejectMap(error, reject)
            }
        })
    }

    /**
     * @param eventName - Event name
     * @param callback - Event callback
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        window.addEventListener('ton-connect-ui-' + eventName, callback)
    }
}
