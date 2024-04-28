import type {
    WalletInterface,
    WalletAdapterInterface,
    WalletPlatformEnum,
    TransactionSignerInterface
} from '@multiplechain/types'

export class Wallet implements WalletInterface {
    adapter: WalletAdapterInterface

    /**
     * @param {WalletAdapterInterface} adapter
     */
    constructor(adapter: WalletAdapterInterface) {
        this.adapter = adapter
    }

    /**
     * @returns {string}
     */
    getId(): string {
        return this.adapter.id
    }

    /**
     * @returns {string}
     */
    getName(): string {
        return this.adapter.name
    }

    /**
     * @returns {string}
     */
    getIcon(): string {
        return this.adapter.name
    }

    /**
     * @returns {WalletPlatformEnum[]}
     */
    getPlatforms(): WalletPlatformEnum[] {
        return this.adapter.platforms
    }

    /**
     * @returns {string}
     */
    getDownloadLink(): string {
        return this.adapter.downloadLink
    }

    /**
     * @param {string} url
     * @param {object} ops
     * @returns {string}
     */
    createDeepLink(url: string, ops?: object): string {
        return this.adapter.createDeepLink(url, ops)
    }

    /**
     * connect to adapter
     * @returns {Promise<string>}
     */
    async connect(): Promise<string> {
        await this.adapter.connect()
        return 'wallet address'
    }

    /**
     * @returns {boolean}
     */
    isDetected(): boolean {
        return this.adapter.isDetected()
    }

    /**
     * @returns {boolean}
     */
    isConnected(): boolean {
        return this.adapter.isConnected()
    }

    /**
     * @returns {Promise<string>}
     */
    async getAddress(): Promise<string> {
        return 'wallet address'
    }

    /**
     * @param {string} message
     */
    async signMessage(message: string): Promise<string> {
        return 'signed message'
    }

    /**
     * @param {TransactionSignerInterface} transactionSigner
     * @returns {Promise<string>}
     */
    async sendTransaction(transactionSigner: TransactionSignerInterface): Promise<string> {
        return 'transaction hash'
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName: string, callback: (...args: any[]) => void): void {
        'wallet events'
    }
}
