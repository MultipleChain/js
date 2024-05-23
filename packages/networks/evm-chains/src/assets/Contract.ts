import { Provider } from '../services/Provider.ts'
import type { Ethers } from '../services/Ethers.ts'
import type { ContractAddress, ContractInterface, WalletAddress } from '@multiplechain/types'
import type { Contract as EthersContract, InterfaceAbi } from 'ethers'
import type { TransactionData } from '../services/TransactionSigner.ts'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: ContractAddress

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
     * @param {ContractAddress} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        this.ABI = ABI ?? []
        this.address = address
        this.provider = provider ?? Provider.instance
        this.ethers = this.provider.ethers
        this.ethersContract = this.ethers.contract(address, this.ABI, this.ethers.jsonRpc)
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
        return this.ethersContract[method](...args) // eslint-disable-line
    }

    /**
     * @param {string} method Method name
     * @param {unknown[]} args Sender wallet address
     * @returns {Promise<string>} Encoded method data
     */
    async getMethodData(method: string, ...args: unknown[]): Promise<string> {
        return this.ethersContract.interface.encodeFunctionData(method, args)
    }

    /**
     * @param {string} method Method name
     * @param {WalletAddress} from Sender wallet address
     * @param {unknown[]} args Method parameters
     * @returns {Promise<number>} Gas limit
     */
    async getMethodEstimateGas(
        method: string,
        from: WalletAddress,
        ...args: unknown[]
    ): Promise<number> {
        return Number(await this.ethersContract[method].estimateGas(...args, { from })) // eslint-disable-line
    }

    /**
     * @param {string} method Method name
     * @param {WalletAddress} from Sender wallet address
     * @param {unknown[]} args Method parameters
     * @returns {Promise<TransactionData>} Transaction data
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
