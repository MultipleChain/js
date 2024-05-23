import { PublicKey } from '@solana/web3.js'
import { Provider } from '../services/Provider.ts'
import type { ContractAddress, ContractInterface, WalletAddress } from '@multiplechain/types'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: ContractAddress

    /**
     * Contract public key
     */
    pubKey: PublicKey

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
        this.pubKey = new PublicKey(address)
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {ContractAddress} Contract address
     */
    getAddress(): ContractAddress {
        return this.address
    }

    /**
     * @param {string} _method Method name
     * @param {unknown[]} _args Method parameters
     * @returns {Promise<unknown>} Method result
     */
    async callMethod(_method: string, ..._args: unknown[]): Promise<unknown> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param {string} _method Method name
     * @param {unknown[]} _args Sender wallet address
     * @returns {Promise<unknown>} Encoded method data
     */
    async getMethodData(_method: string, ..._args: unknown[]): Promise<unknown> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param {string} _method Method name
     * @param {WalletAddress} _from Sender wallet address
     * @param {unknown[]} _args Method parameters
     * @returns {Promise<unknown>} Encoded method data
     */
    async createTransactionData(
        _method: string,
        _from: WalletAddress,
        ..._args: unknown[]
    ): Promise<unknown> {
        throw new Error('Method not implemented.')
    }
}
