import type { ContractInterface } from '@multiplechain/types'

export class Contract implements ContractInterface {
    address: string

    /**
     * @param address Contract address
     */
    constructor(address: string) {
        this.address = address
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
    callMethod(method: string, ...args: any[]): any {
        return {}
    }

    /**
     * @param method Method name
     * @param args Method parameters
     * @returns Method data
     */
    getMethodData(method: string, ...args: any[]): any {
        return {}
    }
}
