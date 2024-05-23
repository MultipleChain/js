import { Provider } from '../services/Provider.ts'
import type { ContractAddress, ContractInterface, WalletAddress } from '@multiplechain/types'
import type { TronWeb } from '../services/TronWeb.ts'

interface InputOutputInterface {
    internalType: string
    name: string
    type: string
}

interface FunctionInterface {
    type: string
    name?: string
    indexed?: boolean
    payable?: boolean
    constant?: boolean
    anonymous?: boolean
    stateMutability?: string
    inputs: InputOutputInterface[]
    outputs?: InputOutputInterface[]
}

export type InterfaceAbi = FunctionInterface[]

type TronContract = Record<string, (...args: any[]) => { call: () => any }>

export interface TransactionDataOptions {
    feeLimit?: number
    callValue?: number
    tokenValue?: number
    tokenId?: number
}

export type TransactionDataParameters = ReadonlyArray<{
    type: string
    value: string | number
}>

export interface TransactionRawData {
    address: string
    method: string
    options: TransactionDataOptions
    parameters: TransactionDataParameters
    from: string
}

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
     * Contract ABI
     */
    ABI: InterfaceAbi

    /**
     * TronWeb service
     */
    tronWeb: TronWeb

    /**
     * Tron contract
     */
    tronContract: TronContract

    /**
     * @param {ContractAddress} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        this.ABI = ABI ?? []
        this.address = address
        this.provider = provider ?? Provider.instance
        this.tronWeb = this.provider.tronWeb
    }

    /**
     * @returns {Promise<void>} Set Tron contract
     */
    async setTronContract(): Promise<void> {
        if (this.tronContract !== undefined) return
        this.tronWeb.setAddress(this.address)
        this.tronContract = await this.tronWeb.contract(this.ABI, this.address)
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
        await this.setTronContract()
        return this.tronContract[method](...args).call() // eslint-disable-line
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
     * @param {string} _function Method name
     * @param {any} parameters Method parameters
     * @param {WalletAddress} from Sender wallet address
     */
    async getEstimateEnergy(
        _function: string,
        parameters: any,
        from: WalletAddress
    ): Promise<number> {
        const res = await this.provider.tronWeb.transactionBuilder.estimateEnergy(
            this.address,
            _function,
            {},
            parameters,
            from
        )

        return res.energy_required ?? 0
    }

    /**
     * @param {string} method Method name
     * @returns {string} Method output
     */
    generateFunction(method: string): string {
        const matchedItem = this.ABI.find((func: FunctionInterface) => func.name === method)
        if (matchedItem !== undefined) {
            let output = matchedItem.name + '('
            const inputs = matchedItem.inputs ?? []
            inputs.forEach((input, index) => {
                if (index > 0) {
                    output += ','
                }
                output += input.type
            })
            output += ')'
            return output
        } else {
            return 'No matching function found.'
        }
    }

    /**
     * @param {string} method Method name
     * @param {unknown[]} args Method parameters
     * @returns {any[]} Method parameters
     */
    generateParameters(method: string, ...args: unknown[]): any {
        const matchedItem = this.ABI.find((func: FunctionInterface) => func.name === method)
        if (matchedItem !== undefined) {
            const inputs = matchedItem.inputs ?? []
            const parameters = [] as unknown[]
            inputs.forEach((input, index) => {
                parameters.push({
                    type: input.type,
                    value: args[index]
                })
            })
            return parameters
        } else {
            return 'No matching function found.'
        }
    }

    /**
     * @param {string} method Method name
     * @param {WalletAddress} from Sender wallet address
     * @param {unknown[]} args Method parameters
     * @returns {Promise<TransactionRawData>} Encoded method data
     */
    async createTransactionData(
        method: string,
        from: WalletAddress,
        ...args: unknown[]
    ): Promise<TransactionRawData> {
        const _function = this.generateFunction(method)
        const parameters = this.generateParameters(method, ...args)
        return {
            address: this.address,
            method: _function,
            options: {},
            parameters,
            from
        }
    }
}
