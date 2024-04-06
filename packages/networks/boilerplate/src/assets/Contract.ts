import { Provider } from '../services/Provider.ts'
import type { ContractInterface } from '@multiplechain/types'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: string

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {string} address Contract address
     * @param {Provider} provider Blockchain network provider
     */
    constructor(address: string, provider?: Provider) {
        this.address = address
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {string} Contract address
     */
    getAddress(): string {
        return this.address
    }

    /**
     * @param {string} method Method name
     * @param {any[]} args Method parameters
     * @returns {Promise<any>} Method result
     */
    async callMethod(method: string, ...args: any[]): Promise<any> {
        return {}
    }

    /**
     * @param {string} method Method name
     * @param {any[]} args Sender wallet address
     * @returns {Promise<string>} Encoded method data
     */
    async getMethodData(method: string, ...args: any[]): Promise<any> {
        return {}
    }
}
