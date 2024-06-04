import type { ContractAddress, NftId, TransferAmount, WalletAddress } from './defines'

/**
 * There are 2 comprehensive interfaces: AssetInterface, ContractInterface
 * Other interfaces have more pinpoint purposes: CoinInterface, TokenInterface, NftInterface
 */

// Comprehensive interfaces
export interface ContractInterface {
    /**
     * Given contract address
     */
    address: ContractAddress

    /**
     * Contract ABI
     */
    cachedMethods: Record<string, unknown>

    /**
     * @returns {ContractAddress} Given contract address
     */
    getAddress: () => ContractAddress

    /**
     * Runs the contract methods dynamically
     * @param {string} method Method name
     * @param {unknown[]} args Method parameters
     * @returns {Promise<unknown>} Result of the method
     */
    callMethod: (method: string, ...args: unknown[]) => Promise<unknown>

    /**
     * Runs the contract methods dynamically
     * @param {string} method Method name
     * @param {unknown[]} args Method parameters
     * @returns {Promise<unknown>} Result of the method
     */
    callMethodWithCache: (method: string, ...args: unknown[]) => Promise<unknown>

    /**
     * To get method data from called method
     * @param {string} method Method name
     * @param {unknown[]} args Method parameters
     * @returns {Promise<unknown>} Method data
     */
    getMethodData: (method: string, ...args: unknown[]) => Promise<unknown>

    /**
     * @param {string} method Method name
     * @param {WalletAddress} from Sender wallet address
     * @param {unknown[]} args Method parameters
     * @returns {Promise<unknown>} Transaction data
     */
    createTransactionData: (
        method: string,
        from: WalletAddress,
        ...args: unknown[]
    ) => Promise<unknown>
}

// The Asset interface covers blockchain-specific standards that can vary between addresses.
// Example Coin (Native currency), Token, NFT etc.
export interface AssetInterface<TransactionSigner> {
    /**
     * @returns {string} Name of the asset (long name)
     */
    getName: () => string

    /**
     * @returns {string} Symbol of the asset (short name)
     */
    getSymbol: () => string

    /**
     * @param {WalletAddress} owner Address of the wallet
     * @returns {Promise<number>} Balance of assets
     */
    getBalance: (owner: WalletAddress) => Promise<number>

    /**
     * Asset transfer between wallets
     * @param {WalletAddress} sender Sender wallet address
     * @param {WalletAddress} receiver Receiver wallet address
     * @param {TransferAmount} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer interface
     */
    transfer: (
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ) => Promise<TransactionSigner>
}

// Sub Interfaces
export interface CoinInterface<TransactionSigner> extends AssetInterface<TransactionSigner> {
    /**
     * Generally is static value you have to return
     * @returns {number} Decimal value of the coin
     */
    getDecimals: () => number
}

export interface TokenInterface<TransactionSigner>
    extends Omit<AssetInterface<TransactionSigner>, 'getName' | 'getSymbol'>,
        ContractInterface {
    /**
     * @override getName() in AssetInterface
     * @returns {Promise<string>} Name of the asset (long name)
     */
    getName: () => Promise<string>

    /**
     * @override getName() in AssetInterface
     * @returns {Promise<string>} Symbol of the asset (short name)
     */
    getSymbol: () => Promise<string>

    /**
     * @returns {Promise<number>} Decimal value of the token
     */
    getDecimals: () => Promise<number>

    /**
     * @returns {Promise<number>} Total supply of the token
     */
    getTotalSupply: () => Promise<number>

    /**
     * If another wallet has been authorized to spend, it allows you to get this value.
     * @param {WalletAddress} owner Address of owner of the tokens that is being used
     * @param {WalletAddress} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of the tokens that is being used by spender
     */
    getAllowance: (owner: WalletAddress, spender: WalletAddress) => Promise<number>

    /**
     * Allowance spending with spender from owner to receiver
     * @param {WalletAddress} spender Address of the spender of transaction
     * @param {WalletAddress} owner Sender wallet address
     * @param {WalletAddress} receiver Receiver wallet address
     * @param {TransferAmount} amount Amount of tokens that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer interface
     */
    transferFrom: (
        spender: WalletAddress,
        owner: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ) => Promise<TransactionSigner>

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {WalletAddress} owner Address of owner of the tokens that will be used
     * @param {WalletAddress} spender Address of the spender that is using the tokens of owner
     * @param {TransferAmount} amount Amount of the tokens that will be used
     * @returns {Promise<TransactionSigner>} Transaction signer interface
     */
    approve: (
        owner: WalletAddress,
        spender: WalletAddress,
        amount: TransferAmount
    ) => Promise<TransactionSigner>
}

export interface NftInterface<TransactionSigner>
    extends Omit<AssetInterface<TransactionSigner>, 'transfer' | 'getName' | 'getSymbol'>,
        ContractInterface {
    /**
     * @override getName() in AssetInterface
     * @returns {Promise<string>} Name of the asset (long name)
     */
    getName: () => Promise<string>

    /**
     * @override getName() in AssetInterface
     * @returns {Promise<string>} Symbol of the asset (short name)
     */
    getSymbol: () => Promise<string>

    /**
     * @param {NftId} nftId ID of the NFT
     * @returns  {Promise<WalletAddress>} Wallet address of owner of the NFT
     */
    getOwner: (nftId: NftId) => Promise<WalletAddress>

    /**
     * @param {NftId} nftId ID of the NFT
     * @returns {Promise<string>} URL of the metadata
     */
    getTokenURI: (nftId: NftId) => Promise<string>

    /**
     * If another wallet has been authorized to spend, it allows you to get this value.
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<WalletAddress | null>} Amount of the tokens that is being used by spender
     */
    getApproved: (nftId: NftId) => Promise<WalletAddress | null>

    /**
     * Transfers an NFT
     * @override transfer() in AssetInterface
     * @param {WalletAddress} sender Sender wallet address
     * @param {WalletAddress} receiver Receiver wallet address
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer interface
     */
    transfer: (
        sender: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId
    ) => Promise<TransactionSigner>

    /**
     * @param {WalletAddress} spender Address of the spender of transaction
     * @param {WalletAddress} owner Address of owner of the nfts that will be used
     * @param {WalletAddress} receiver Address of the receiver that will receive the nfts
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer interface
     */
    transferFrom: (
        spender: WalletAddress,
        owner: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId
    ) => Promise<TransactionSigner>

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {WalletAddress} owner Address of owner of the tokens that will be used
     * @param {WalletAddress} spender Address of the spender that will use the tokens of owner
     * @param {NftId} nftId ID of the NFT that will be transferred
     */
    approve: (
        owner: WalletAddress,
        spender: WalletAddress,
        nftId: NftId
    ) => Promise<TransactionSigner>
}
