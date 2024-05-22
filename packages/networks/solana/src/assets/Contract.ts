import { PublicKey } from '@solana/web3.js'
import { Provider } from '../services/Provider.ts'
import type { ContractInterface } from '@multiplechain/types'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: string

    pubKey: PublicKey
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
        this.pubKey = new PublicKey(address)
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {string} Contract address
     */
    getAddress(): string {
        return this.address
    }

    /**
     * @param {string} _method Method name
     * @param {any[]} _args Method parameters
     * @returns {Promise<any>} Method result
     */
    async callMethod(_method: string, ..._args: any[]): Promise<any> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param {string} _method Method name
     * @param {any[]} _args Sender wallet address
     * @returns {Promise<string>} Encoded method data
     */
    async getMethodData(_method: string, ..._args: any[]): Promise<any> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param {string} _method Method name
     * @param {string} _from Sender wallet address
     * @param {any[]} _args Method parameters
     * @returns {Promise<any>} Encoded method data
     */
    async createTransactionData(_method: string, _from: string, ..._args: any[]): Promise<any> {
        throw new Error('Method not implemented.')
    }
}
