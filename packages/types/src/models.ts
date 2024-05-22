import type { AssetDirectionEnum, TransactionStatusEnum } from './enums.ts'

export interface TransactionInterface<TxData = unknown> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: string

    /**
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<TransactionStatusEnum>} Promise of the transaction status
     */
    wait: (ms?: number) => Promise<TransactionStatusEnum>

    /**
     * @returns {Promise<TxData | null>} Raw transaction data that is taken by blockchain network via RPC.
     */
    getData: () => Promise<TxData | null>

    /**
     * @returns {string} ID of the transaction
     * this can be different names like txid, hash, signature etc.
     */
    getId: () => string

    /**
     * @returns {string} Blockchain explorer URL of the transaction. Dependant on network.
     */
    getUrl: () => string

    /**
     * @returns {Promise<string>} Wallet address of the signer of transaction
     */
    getSigner: () => Promise<string>

    /**
     * @returns {Promise<number>} Transaction fee as native coin amount
     */
    getFee: () => Promise<number>

    /**
     * @returns {Promise<number>} Block ID of the transaction
     */
    getBlockNumber: () => Promise<number>

    /**
     * @returns {Promise<number>} UNIX timestamp of the date that block is added to blockchain
     */
    getBlockTimestamp: () => Promise<number>

    /**
     * @returns {Promise<number>} Block confirmation amount
     */
    getBlockConfirmationCount: () => Promise<number>

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction.
     */
    getStatus: () => Promise<TransactionStatusEnum>
}

export interface ContractTransactionInterface extends TransactionInterface {
    /**
     * @returns {Promise<string>} Smart contract address of the transaction
     */
    getAddress: () => Promise<string>
}

export interface AssetTransactionInterface extends TransactionInterface {
    /**
     * @returns {Promise<string>} Receiver wallet address of the transaction (asset)
     */
    getReceiver: () => Promise<string>

    /**
     * @returns {Promise<string>} Wallet address of the sender of asset
     */
    getSender: () => Promise<string>

    /**
     * @returns {Promise<number>} Transfer amount of the transaction (coin)
     */
    getAmount: () => Promise<number>

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (asset)
     * @param {string} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
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
     * @returns {Promise<number | string>} ID of the NFT
     */
    getNftId: () => Promise<number | string>

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (nft)
     * @param {string} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @override verifyTransfer() in AssetTransactionInterface
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    verifyTransfer: (
        direction: AssetDirectionEnum,
        address: string,
        nftId: number | string
    ) => Promise<TransactionStatusEnum>
}
