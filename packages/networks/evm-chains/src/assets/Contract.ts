import type { ContractInterface } from '@multiplechain/types'
import type { Contract as EthersContract } from 'ethers'
import { Provider } from '../services/Provider.ts'

export class Contract implements ContractInterface {
    /**
     * Contract address
     */
    address: string

    /**
     * Contract ABI
     */
    ABI: object[]

    /**
     * Ethers contract
     */
    ethersContract: EthersContract

    /**
     * @param address Contract address
     * @param ABIArray Contract ABI
     */
    constructor(address: string, ABI: object[]) {
        this.ABI = ABI
        this.address = address
        const { ethers } = Provider.instance
        this.ethersContract = ethers.contract(address, ABI, ethers.jsonRpc)
    }

    /**
     * @returns Contract address
     */
    getAddress(): string {
        return this.address
    }

    /**
     * @param method Method name
     * @param args Method parameters
     * @returns Method result
     */
    async callMethod(method: string, ...args: any[]): Promise<any> {
        return this.ethersContract[method](...args) // eslint-disable-line
    }

    /**
     * @param method Method name
     * @param args Method parameters
     * @returns Method data
     */
    async getMethodData(method: string, ...args: any[]): Promise<string> {
        return this.ethersContract.interface.encodeFunctionData(method, args)
    }

    /**
     * @param method Method name
     * @param from Sender wallet address
     * @param args Method parameters
     * @returns Gas estimate
     */
    async getMethodEstimateGas(method: string, from: string, ...args: any[]): Promise<number> {
        return Number(await this.ethersContract[method].estimateGas(...args, { from })) // eslint-disable-line
    }
}
