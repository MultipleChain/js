import type { AssetDirectionEnum, TransactionStatusEnum } from './enums.ts'

export interface TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * @returns Promise of the transaction status
     */
    wait: () => Promise<TransactionStatusEnum>

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    getData: () => Promise<object | null>

    /**
     * @returns Transaction id from the blockchain network
     * this can be different names like txid, hash, signature etc.
     */
    getId: () => string

    /**
     * @returns Blockchain explorer URL of the transaction. Dependant on network.
     */
    getUrl: () => string

    /**
     * @returns Wallet address of the sender of transaction
     */
    getSender: () => Promise<string>

    /**
     * @returns Transaction fee as native coin amount
     */
    getFee: () => Promise<number>

    /**
     * @returns Block ID of the transaction
     */
    getBlockNumber: () => Promise<number>

    /**
     * @returns UNIX timestamp of the date that block is added to blockchain
     */
    getBlockTimestamp: () => Promise<number>

    /**
     * @returns Block confirmation amount
     */
    getBlockConfirmationCount: () => Promise<number>

    /**
     * @returns Status of the transaction.
     */
    getStatus: () => Promise<TransactionStatusEnum>
}

export interface ContractTransactionInterface extends TransactionInterface {
    /**
     * @returns Smart contract address of the transaction
     */
    getAddress: () => Promise<string>
}

export interface AssetTransactionInterface extends TransactionInterface {
    /**
     * @returns Receiver wallet address of the transaction (asset)
     */
    getReceiver: () => Promise<string>

    /**
     * @returns Transfer amount of the transaction (coin)
     */
    getAmount: () => Promise<number>

    /**
     * @returns Wallet address of the sender of asset
     */
    getFrom: () => Promise<string>

    /**
     * @param direction - Direction of the transaction (asset)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param amount Amount of assets that will be transferred
     */
    verifyTransfer: (
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ) => Promise<TransactionStatusEnum>
}

export interface CoinTransactionInterface extends AssetTransactionInterface {}

export interface TokenTransactionInterface
    extends AssetTransactionInterface,
        ContractTransactionInterface {}

export interface NftTransactionInterface
    extends Omit<AssetTransactionInterface, 'verifyTransfer' | 'getAmount'>,
        ContractTransactionInterface {
    /**
     * @returns ID of the NFT
     */
    getNftId: () => Promise<number>

    /**
     * @param direction - Direction of the transaction (nft)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     */
    verifyTransfer: (
        direction: AssetDirectionEnum,
        address: string,
        nftId: number
    ) => Promise<TransactionStatusEnum>
}
