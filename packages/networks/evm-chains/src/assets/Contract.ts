import { Provider } from '../services/Provider'
import type { Ethers } from '../services/Ethers'
import type { ContractAddress, ContractInterface, WalletAddress } from '@multiplechain/types'
import type { Contract as EthersContract, InterfaceAbi } from 'ethers'
import type { TransactionData } from '../services/TransactionSigner'

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
     * Contract ABI
     */
    ABI: InterfaceAbi

    /**
     * Ethers contract
     */
    ethersContract: EthersContract

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * Ethers service
     */
    ethers: Ethers

    /**
     * @param address Contract address
     * @param provider Blockchain network provider
     * @param ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        this.ABI = ABI ?? []
        this.address = address
        this.provider = provider ?? Provider.instance
        this.ethers = this.provider.ethers
        this.ethersContract = this.ethers.contract(address, this.ABI, this.ethers.jsonRpc)
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
        return this.ethersContract[method](...args) // eslint-disable-line
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
    async getMethodData(method: string, ...args: unknown[]): Promise<string> {
        return this.ethersContract.interface.encodeFunctionData(method, args)
    }

    /**
     * @param method Method name
     * @param from Sender wallet address
     * @param args Method parameters
     * @returns Gas limit
     */
    async getMethodEstimateGas(
        method: string,
        from: WalletAddress,
        ...args: unknown[]
    ): Promise<number> {
        return Number(await this.ethersContract[method].estimateGas(...args, { from })) // eslint-disable-line
    }

    /**
     * @param method Method name
     * @param from Sender wallet address
     * @param args Method parameters
     * @returns Transaction data
     */
    async createTransactionData(
        method: string,
        from: WalletAddress,
        ...args: unknown[]
    ): Promise<TransactionData> {
        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            this.provider.ethers.getGasPrice(),
            this.provider.ethers.getNonce(from),
            this.getMethodData(method, ...args), // eslint-disable-line
            this.getMethodEstimateGas(method, from, ...args) // eslint-disable-line
        ])

        return {
            from,
            data,
            nonce,
            gasPrice,
            gasLimit,
            value: '0x0',
            to: this.getAddress(),
            chainId: this.provider.network.id
        }
    }
}
