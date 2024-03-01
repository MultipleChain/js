import type { AssetDirectionEnum, TransactionStatusEnum } from './enums.js'

export interface TransactionInterface {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * @returns Raw transaction data that is taken by blockchain network via RPC.
     */
    getData: () => object

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
    getSender: () => string

    /**
     * @returns Transaction fee as native coin amount
     */
    getFee: () => number

    /**
     * @returns Block ID of the transaction
     */
    getBlockNumber: () => number

    /**
     * @returns UNIX timestamp of the date that block is added to blockchain
     */
    getBlockTimestamp: () => number

    /**
     * @returns Block confirmation amount
     */
    getBlockConfirmationCount: () => number

    /**
     * @returns Status of the transaction.
     */
    getStatus: () => TransactionStatusEnum
}

export interface ContractTransactionInterface extends TransactionInterface {
    /**
     * @returns Smart contract address of the transaction
     */
    getAddress: () => string
}

export interface AssetTransactionInterface extends TransactionInterface {
    /**
     * @returns Receiver wallet address of the transaction (asset)
     */
    getReceiver: () => string

    /**
     * @param direction - Direction of the transaction (asset)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param amount Amount of assets that will be transferred
     */
    verifyTransfer: (
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ) => TransactionStatusEnum
}

export interface CoinTransactionInterface extends AssetTransactionInterface {
    /**
     * @returns Transfer amount of the transaction (coin)
     */
    getAmount: () => number
}

export interface TokenTransactionInterface
    extends AssetTransactionInterface,
        ContractTransactionInterface {
    /**
     * @param direction - Direction of the transaction (token)
     * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
     */
    verifyApprove: (
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ) => TransactionStatusEnum
}

export interface NftTransactionInterface
    extends Omit<AssetTransactionInterface, 'verifyTransfer'>,
        ContractTransactionInterface {
    /**
     * @returns ID of the NFT
     */
    getNftId: () => number

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
    ) => TransactionStatusEnum
}
