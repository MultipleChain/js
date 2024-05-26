import { Provider } from '../services/Provider'
import type { ContractAddress, ContractInterface, WalletAddress } from '@multiplechain/types'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: ContractAddress

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {ContractAddress} address Contract address
     * @param {Provider} provider Blockchain network provider
     */
    constructor(address: ContractAddress, provider?: Provider) {
        this.address = address
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {ContractAddress} Contract address
     */
    getAddress(): ContractAddress {
        return this.address
    }

    /**
     * @param {string} method Method name
     * @param {unknown[]} args Method parameters
     * @returns {Promise<unknown>} Method result
     */
    async callMethod(method: string, ...args: unknown[]): Promise<unknown> {
        return {}
    }

    /**
     * @param {string} method Method name
     * @param {unknown[]} args Sender wallet address
     * @returns {Promise<unknown>} Encoded method data
     */
    async getMethodData(method: string, ...args: unknown[]): Promise<unknown> {
        return {}
    }

    /**
     * @param {string} method Method name
     * @param {WalletAddress} from Sender wallet address
     * @param {unknown[]} args Method parameters
     * @returns {Promise<unknown>} Encoded method data
     */
    async createTransactionData(
        method: string,
        from: WalletAddress,
        ...args: any[]
    ): Promise<unknown> {
        return ''
    }
}
