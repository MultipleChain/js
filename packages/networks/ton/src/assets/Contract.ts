import { Provider } from '../services/Provider'
import { Address, beginCell, type Cell, type Builder } from '@ton/core'
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
        ..._args: any[]
    ): Promise<unknown> {
        throw new Error('Method not implemented.')
    }

    /**
     * @param cell Cell builder
     * @param receiver Receiver address
     * @param sender Sender address
     * @param body Message body
     * @returns Cell builder
     */
    endCell(cell: Builder, receiver: string, sender: string, body?: string): Cell {
        cell.storeAddress(Address.parse(receiver))
            .storeAddress(Address.parse(sender))
            .storeBit(0)
            .storeCoins(1n)

        if (body) {
            cell.storeBit(1).storeRef(beginCell().storeUint(0, 32).storeStringTail(body).endCell())
        } else {
            cell.storeBit(0)
        }

        return cell.endCell()
    }
}
