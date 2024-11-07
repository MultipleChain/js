import { PublicKey } from '@solana/web3.js'
import { Provider } from '../services/Provider'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
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
     * Contract public key
     */
    pubKey: PublicKey

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
        this.pubKey = new PublicKey(address)
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns Contract address
     */
    getAddress(): ContractAddress {
        return this.address
    }

    /**
     * @param _method Method name
     * @param _args Method parameters
     * @returns Method result
     */
    async callMethod(_method: string, ..._args: unknown[]): Promise<unknown> {
        throw new Error('Method not implemented.')
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
     * @param _method Method name
     * @param _args Sender wallet address
     * @returns Encoded method data
     */
    async getMethodData(_method: string, ..._args: unknown[]): Promise<unknown> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param _method Method name
     * @param _from Sender wallet address
     * @param _args Method parameters
     * @returns Encoded method data
     */
    async createTransactionData(
        _method: string,
        _from: WalletAddress,
        ..._args: unknown[]
    ): Promise<unknown> {
        throw new Error('Method not implemented.')
    }

    async getTokenAccount(ownerPubKey: PublicKey, programId: PublicKey): Promise<PublicKey> {
        let account: PublicKey | null = null
        try {
            const result = await this.provider.web3.getParsedTokenAccountsByOwner(ownerPubKey, {
                mint: this.pubKey,
                programId
            })
            if (result.value.length === 0) {
                account = null
            } else {
                account = result.value[0]?.pubkey ?? null
            }
        } catch (error) {
            account = null
        }

        if (account === null) {
            account = getAssociatedTokenAddressSync(this.pubKey, ownerPubKey, false, programId)
        }

        return account
    }
}
