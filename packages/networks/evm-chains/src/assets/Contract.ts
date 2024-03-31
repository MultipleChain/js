import { Provider } from '../services/Provider.ts'
import type { Ethers } from '../services/Ethers.ts'
import type { ContractInterface } from '@multiplechain/types'
import type { Contract as EthersContract, InterfaceAbi } from 'ethers'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: string

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
     * @param {string} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: string, provider?: Provider, ABI?: InterfaceAbi) {
        this.ABI = ABI ?? []
        this.address = address
        this.provider = provider ?? Provider.instance
        this.ethers = this.provider.ethers
        this.ethersContract = this.ethers.contract(address, this.ABI, this.ethers.jsonRpc)
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
        return this.ethersContract[method](...args) // eslint-disable-line
    }

    /**
     * @param {string} method Method name
     * @param {any[]} args Sender wallet address
     * @returns {Promise<string>} Encoded method data
     */
    async getMethodData(method: string, ...args: any[]): Promise<string> {
        return this.ethersContract.interface.encodeFunctionData(method, args)
    }

    /**
     * @param {string} method Method name
     * @param {string} from Sender wallet address
     * @param {any[]} args Method parameters
     * @returns {Promise<number>} Gas limit
     */
    async getMethodEstimateGas(method: string, from: string, ...args: any[]): Promise<number> {
        return Number(await this.ethersContract[method].estimateGas(...args, { from })) // eslint-disable-line
    }
}
