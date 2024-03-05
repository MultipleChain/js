import { Asset } from './Asset.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { TokenInterface, TransactionSignerInterface } from '@multiplechain/types'

export class Token extends Asset implements TokenInterface {
    address: string

    /**
     * @param address Contract address
     */
    constructor(address: string) {
        super()
        this.address = address
    }

    /**
     * @returns Contract address
     */
    getAddress(): string {
        return 'example'
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return 18
    }

    /**
     * @returns Total supply of the token
     */
    getTotalSupply(): number {
        return 0
    }

    /**
     * @param method Method name
     * @param args Method parameters
     * @returns Method result
     */
    callMethod(method: string, args: any[]): any {
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

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param amount Amount of the tokens that will be used
     */
    approve(owner: string, spender: string, amount: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }

    /**
     * @param owner Address of owner of the tokens that is being used
     * @param spender Address of the spender that is using the tokens of owner
     * @returns Amount of the tokens that is being used by spender
     */
    allowance(owner: string, spender: string): number {
        return 0
    }
}
