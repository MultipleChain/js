import type { WalletPlatformEnum } from '../enums.ts'
import type { WalletAdapterInterface } from './adapter.ts'
import type { TransactionSignerInterface } from '../services/TransactionSignerInterface.ts'

export interface WalletInterface {
    adapter: WalletAdapterInterface

    /**
     * @returns {String}
     */
    getId: () => string

    /**
     * @returns {String}
     */
    getName: () => string

    /**
     * @returns {WalletPlatformEnum[]}
     */
    getPlatforms: () => WalletPlatformEnum[]

    /**
     * @returns {String}
     */
    getDownloadLink: () => string

    /**
     * @param {String} url
     * @param {Object} ops
     * @returns {String}
     */
    createDeepLink: (url: string, ops?: object) => string

    /**
     * @returns {Promise<string>}
     */
    connect: () => Promise<string>

    /**
     * @returns {Boolean}
     */
    isDetected: () => boolean

    /**
     * @returns {Boolean}
     */
    isConnected: () => boolean

    /**
     * @returns {Promise<string>}
     */
    getAddress: () => Promise<string>

    /**
     * @param {string} message
     * @returns {Promise<string>}
     */
    signMessage: (message: string) => Promise<string>

    /**
     * @param {TransactionSignerInterface} transactionSigner
     * @returns {Promise<string>}
     */
    sendTransaction: (transactionSigner: TransactionSignerInterface) => Promise<string>

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @returns {Promise<void>}
     */
    on: (eventName: string, callback: (...args: any[]) => void) => Promise<void>
}
