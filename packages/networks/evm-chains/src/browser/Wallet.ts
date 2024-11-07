import {
    type WalletInterface,
    type WalletAdapterInterface,
    type WalletPlatformEnum,
    ErrorTypeEnum,
    type ConnectConfig,
    type UnknownConfig,
    type TransactionId,
    type SignedMessage,
    type WalletAddress
} from '@multiplechain/types'
import { Provider } from '../services/Provider'
import type { EIP1193Provider } from './adapters/EIP6963'
import { toHex } from '@multiplechain/utils'
import type { TransactionSigner } from '../services/TransactionSigner'

const rejectMap = (error: any, reject: (a: any) => any): any => {
    console.error('MultipleChain EVM Wallet Error:', error)

    const errorMessage = String(error.message ?? '')
    if (
        errorMessage === 'Not supported chainId' ||
        errorMessage.includes('chain ID') ||
        errorMessage.includes('networkConfigurationId') ||
        errorMessage.includes('The Provider is not connected to the requested chain.')
    ) {
        return reject(new Error(ErrorTypeEnum.UNACCEPTED_CHAIN))
    } else if (
        error.code === 4001 ||
        error.error === 'Rejected by user' ||
        errorMessage === 'cancelled' ||
        errorMessage === 'User canceled' ||
        errorMessage === 'user reject this request' ||
        errorMessage === 'User rejected the transaction' ||
        errorMessage === 'An unexpected error occurred' ||
        errorMessage === 'User disapproved requested chains'
    ) {
        return reject(new Error(ErrorTypeEnum.WALLET_REQUEST_REJECTED))
    } else if (
        errorMessage.includes('User') ||
        errorMessage.includes('Rejected') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('disapproved requested chains')
    ) {
        return reject(new Error(ErrorTypeEnum.WALLET_REQUEST_REJECTED))
    } else if (errorMessage.includes('Invalid RPC URL')) {
        return reject(new Error(ErrorTypeEnum.RPC_REQUEST_ERROR))
    } else if (
        error.code === -32000 ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('request timed out')
    ) {
        return reject(new Error(ErrorTypeEnum.RPC_TIMEOUT))
    } else if (error.code === -32603 || error.code === -32602) {
        return reject(new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED))
    } else if (error.code === -32601) {
        return reject(new Error(ErrorTypeEnum.RPC_REQUEST_ERROR))
    } else if (
        error.code === -32002 ||
        error.message === 'Already processing eth_requestAccounts. Please wait.'
    ) {
        return reject(new Error(ErrorTypeEnum.WALLET_ALREADY_PROCESSING))
    } else if (error.message === 'User closed modal') {
        return reject(new Error(ErrorTypeEnum.CLOSED_WALLETCONNECT_MODAL))
    } else if (error.message === 'transaction underpriced') {
        return reject(new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED))
    }

    return reject(error)
}

type WalletAdapter = WalletAdapterInterface<Provider, EIP1193Provider> & {
    provider?:
        | EIP1193Provider
        | { on: (eventName: string, callback: (...args: any[]) => void) => void }
}

export interface RequestType {
    method: string
    params?: any[] | object
}

export class Wallet implements WalletInterface<Provider, EIP1193Provider, TransactionSigner> {
    adapter: WalletAdapter

    walletProvider: EIP1193Provider

    networkProvider: Provider

    /**
     * @param adapter - Wallet adapter
     * @param provider - Blockchain network provider
     */
    constructor(adapter: WalletAdapter, provider?: Provider) {
        this.adapter = adapter
        this.networkProvider = provider ?? Provider.instance
    }

    /**
     * @param payload RequestType
     * @returns any
     */
    async request(payload: RequestType): Promise<any> {
        const res = await this.walletProvider.request(payload)
        if (res?.error !== undefined) {
            const error = res.error as {
                code: number
                message: string
            }
            if (error.code === -32000) {
                throw new Error(ErrorTypeEnum.RPC_TIMEOUT)
            }
            throw new Error(error.message)
        }
        return res
    }

    /**
     * @returns Wallet ID
     */
    getId(): string {
        return this.adapter.id
    }

    /**
     * @returns Wallet name
     */
    getName(): string {
        return this.adapter.name
    }

    /**
     * @returns Wallet icon
     */
    getIcon(): string {
        return this.adapter.icon
    }

    /**
     * @returns Wallet platforms
     */
    getPlatforms(): WalletPlatformEnum[] {
        return this.adapter.platforms
    }

    /**
     * @returns Wallet download link
     */
    getDownloadLink(): string | undefined {
        return this.adapter.downloadLink
    }

    /**
     * @param url - Deep link URL
     * @param config - Deep link configuration
     * @returns Deep link
     */
    createDeepLink(url: string, config?: UnknownConfig): string | null {
        if (this.adapter.createDeepLink === undefined) {
            return null
        }

        return this.adapter.createDeepLink(url, config)
    }

    /**
     * @param config - Connection configuration
     * @returns WalletAddress
     */
    async connect(config?: ConnectConfig): Promise<WalletAddress> {
        return await new Promise((resolve, reject) => {
            this.adapter
                .connect(this.networkProvider, config)
                .then(async (provider) => {
                    this.walletProvider = provider

                    const chainId = await this.getChainId()

                    if (this.networkProvider.network.id !== chainId) {
                        reject(ErrorTypeEnum.UNACCEPTED_CHAIN)
                        return
                    }

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
     * @returns boolean
     */
    async isDetected(): Promise<boolean> {
        return await this.adapter.isDetected()
    }

    /**
     * @returns boolean
     */
    async isConnected(): Promise<boolean> {
        return await this.adapter.isConnected()
    }

    /**
     * @returns number
     */
    async getChainId(): Promise<number> {
        const chainId = await this.request({ method: 'eth_chainId' })
        return typeof chainId === 'number' ? chainId : parseInt(chainId as string, 16)
    }

    /**
     * @returns WalletAddress
     */
    async getAddress(): Promise<WalletAddress> {
        return (await this.walletProvider.request({ method: 'eth_accounts' }))[0]
    }

    /**
     * @param message - Message to sign
     * @returns SignedMessage
     */
    async signMessage(message: string): Promise<SignedMessage> {
        const address = await this.getAddress()
        return await new Promise((resolve, reject) => {
            this.walletProvider
                .request({
                    method: 'personal_sign',
                    params: [message, address]
                })
                .then((signature: string) => {
                    resolve(signature)
                })
                .catch((error) => {
                    rejectMap(error, reject)
                })
        })
    }

    /**
     * @param transactionSigner - Transaction signer
     * @returns TransactionId
     */
    async sendTransaction(transactionSigner: TransactionSigner): Promise<TransactionId> {
        return await new Promise((resolve, reject) => {
            const data = transactionSigner.getRawData()
            data.gas = toHex(data.gasLimit as number)
            delete data.chainId
            delete data.nonce
            delete data.gasLimit
            delete data.gasPrice
            this.walletProvider
                .request({
                    method: 'eth_sendTransaction',
                    params: [data]
                })
                .then((txHash: string) => {
                    resolve(txHash)
                })
                .catch((error) => {
                    rejectMap(error, reject)
                })
        })
    }

    /**
     * @param eventName - Event name
     * @param callback - Event callback
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        this.walletProvider.on(eventName, callback)
    }
}
