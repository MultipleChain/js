import { Provider } from '../services/Provider'
import type { ContractAddress, ContractInterface, WalletAddress } from '@multiplechain/types'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: ContractAddress

    /**
     * Cached static methods
     */
    cachedMethods: Record<string, unknown> = {}

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param address Contract address
     * @param provider Blockchain network provider
     */
    constructor(address: ContractAddress, provider?: Provider) {
        this.address = address
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Contract address
     */
    getAddress(): ContractAddress {
        return this.address
    }

    /**
     * @param method Method name
     * @param args Method parameters
     * @returns Method result
     */
    async callMethod(method: string, ...args: unknown[]): Promise<unknown> {
        return {}
    }

    /**
     * @param method Method name
     * @param args Method parameters
     * @returns Method result
     */
    async callMethodWithCache(method: string, ...args: unknown[]): Promise<unknown> {
        if (this.cachedMethods[method] !== undefined) {
            return this.cachedMethods[method]
        }

        return (this.cachedMethods[method] = await this.callMethod(method, ...args))
    }

    /**
     * @param method Method name
     * @param args Sender wallet address
     * @returns Encoded method data
     */
    async getMethodData(method: string, ...args: unknown[]): Promise<unknown> {
        return {}
    }

    /**
     * @param method Method name
     * @param from Sender wallet address
     * @param args Method parameters
     * @returns Encoded method data
     */
    async createTransactionData(
        method: string,
        from: WalletAddress,
        ...args: any[]
    ): Promise<unknown> {
        return ''
    }
}
