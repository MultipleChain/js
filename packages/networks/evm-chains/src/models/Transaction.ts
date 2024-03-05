import type { TransactionInterface } from '@multiplechain/types'
import { TransactionStatusEnum } from '@multiplechain/types'

export class Transaction implements TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    constructor(id: string) {
        this.id = id
    }

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    getData(): object {
        return {}
    }

    /**
     * @returns Transaction id from the blockchain network
     * this can be different names like txid, hash, signature etc.
     */
    getId(): string {
        return this.id
    }

    /**
     * @returns Blockchain explorer URL of the transaction. Dependant on network.
     */
    getUrl(): string {
        return 'example'
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    getSender(): string {
        return 'example'
    }

    /**
     * @returns Transaction fee as native coin amount
     */
    getFee(): number {
        return 0
    }

    /**
     * @returns Block ID of the transaction
     */
    getBlockNumber(): number {
        return 0
    }

    /**
     * @returns UNIX timestamp of the date that block is added to blockchain
     */
    getBlockTimestamp(): number {
        return 0
    }

    /**
     * @returns Confirmation count of the block that transaction is included
     */
    getBlockConfirmationCount(): number {
        return 0
    }

    /**
     * @returns Status of the transaction
     */
    getStatus(): TransactionStatusEnum {
        return TransactionStatusEnum.CONFIRMED
    }
}
