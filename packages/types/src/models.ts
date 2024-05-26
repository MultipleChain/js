import type { AssetDirectionEnum, TransactionStatusEnum, TransactionTypeEnum } from './enums'
import type {
    BlockConfirmationCount,
    BlockNumber,
    BlockTimestamp,
    ContractAddress,
    NftId,
    TransactionFee,
    TransactionId,
    TransferAmount,
    WalletAddress
} from './defines'

export interface TransactionInterface<TxData = unknown> {
    /**
     * Each transaction has its own unique ID defined by the user
     */
    id: TransactionId

    /**
     * Raw transaction data that is taken by blockchain network via RPC.
     */
    data: TxData | null

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
     * this can be different names like txid, hash, signature etc.
     * @returns {TransactionId} ID of the transaction
     */
    getId: () => TransactionId

    /**
     * @returns {Promise<TransactionTypeEnum>} Type of the transaction
     */
    getType: () => Promise<TransactionTypeEnum>

    /**
     * @returns {string} Blockchain explorer URL of the transaction. Dependant on network.
     */
    getUrl: () => string

    /**
     * @returns {Promise<WalletAddress>} Wallet address of the signer of transaction
     */
    getSigner: () => Promise<WalletAddress>

    /**
     * @returns {Promise<TransactionFee>} Transaction fee as native coin amount
     */
    getFee: () => Promise<TransactionFee>

    /**
     * @returns {Promise<BlockNumber>} Block ID of the transaction
     */
    getBlockNumber: () => Promise<BlockNumber>

    /**
     * @returns {Promise<BlockTimestamp>} UNIX timestamp of the date that block is added to blockchain
     */
    getBlockTimestamp: () => Promise<BlockTimestamp>

    /**
     * @returns {Promise<BlockConfirmationCount>} Block confirmation amount
     */
    getBlockConfirmationCount: () => Promise<BlockConfirmationCount>

    /**
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction.
     */
    getStatus: () => Promise<TransactionStatusEnum>
}

export interface ContractTransactionInterface extends TransactionInterface {
    /**
     * @returns {Promise<ContractAddress>} Smart contract address of the transaction
     */
    getAddress: () => Promise<ContractAddress>
}

export interface AssetTransactionInterface extends TransactionInterface {
    /**
     * @returns {Promise<WalletAddress>} Receiver wallet address of the transaction (asset)
     */
    getReceiver: () => Promise<WalletAddress>

    /**
     * @returns {Promise<WalletAddress>} Wallet address of the sender of asset
     */
    getSender: () => Promise<WalletAddress>

    /**
     * @returns {Promise<TransferAmount>} Transfer amount of the transaction (coin)
     */
    getAmount: () => Promise<TransferAmount>

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (asset)
     * @param {WalletAddress} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {TransferAmount} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    verifyTransfer: (
        direction: AssetDirectionEnum,
        address: WalletAddress,
        amount: TransferAmount
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
     * Replaces getAmount in the Asset interface.
     * @returns {Promise<NftId>} ID of the NFT
     */
    getNftId: () => Promise<NftId>

    /**
     * @override verifyTransfer() in AssetTransactionInterface
     * @param {AssetDirectionEnum} direction - Direction of the transaction (nft)
     * @param {WalletAddress} address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
     */
    verifyTransfer: (
        direction: AssetDirectionEnum,
        address: WalletAddress,
        nftId: NftId
    ) => Promise<TransactionStatusEnum>
}
