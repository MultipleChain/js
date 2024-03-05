import { Asset } from './Asset.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { NftInterface, TransactionSignerInterface } from '@multiplechain/types'

export class NFT extends Asset implements NftInterface {
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
     * @returns NFT ID
     */
    getNftId(): number {
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
     * @param sender Sender address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    transfer(sender: string, receiver: string, nftId: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }

    /**
     * @param nftId NFT ID
     * @returns NFT owner wallet address
     */
    getOwner(nftId: number): string {
        return 'example'
    }

    /**
     * @param nftId NFT ID
     * @returns NFT URI
     */
    getTokenURI(nftId: number): string {
        return 'example'
    }
}
