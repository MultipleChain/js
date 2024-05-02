import type { TransactionSignerInterface } from './services/TransactionSignerInterface.ts'

/**
 * There are 2 comprehensive interfaces: AssetInterface, ContractInterface
 * Other interfaces have more pinpoint purposes: CoinInterface, TokenInterface, NftInterface
 */

// Comprehensive interfaces
export interface ContractInterface {
    /**
     * Given contract address
     */
    address: string

    /**
     * @returns {string} Given contract address
     */
    getAddress: () => string

    /**
     * @param {string} method Method name
     * @param {any[]} args Method parameters
     * Runs the contract methods dynamically
     */
    callMethod: (method: string, ...args: any[]) => Promise<any>

    /**
     * @param {string} method Method name
     * @param {any[]} args Method parameters
     * To get information from called method
     * @returns Data used in transaction
     */
    getMethodData: (method: string, ...args: any[]) => Promise<any>

    /**
     * @param {string} method Method name
     * @param {string} from Sender wallet address
     * @param {any[]} args Method parameters
     * @returns {Promise<any>} Transaction data
     */
    createTransactionData: (method: string, from: string, ...args: any[]) => Promise<any>
}

export interface AssetInterface {
    /**
     * @returns {string} Name of the asset (long name)
     */
    getName: () => string

    /**
     * @returns {string} Symbol of the asset (short name)
     */
    getSymbol: () => string

    /**
     * @param {string} owner Address of the wallet
     * @returns {Promise<number>} Wallet balance as currency of TOKEN or COIN assets
     */
    getBalance: (owner: string) => Promise<number>

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param {string} sender Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSignerInterface>} Transaction signer interface
     */
    transfer: (
        sender: string,
        receiver: string,
        amount: number
    ) => Promise<TransactionSignerInterface>
}

// Sub Interfaces
export interface CoinInterface extends AssetInterface {
    /**
     * @returns {number} Decimal value of the coin
     */
    getDecimals: () => number
}

export interface TokenInterface
    extends Omit<AssetInterface, 'getName' | 'getSymbol'>,
        ContractInterface {
    /**
     * @returns {Promise<string>} Name of the asset (long name)
     */
    getName: () => Promise<string>

    /**
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
     * @param {string} owner Address of owner of the tokens that is being used
     * @param {string} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of the tokens that is being used by spender
     */
    getAllowance: (owner: string, spender: string) => Promise<number>

    /**
     * @param {string} spender Address of the spender of transaction
     * @param {string} owner Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of tokens that will be transferred
     * @returns {Promise<TransactionSignerInterface>} Transaction signer interface
     */
    transferFrom: (
        spender: string,
        owner: string,
        receiver: string,
        amount: number
    ) => Promise<TransactionSignerInterface>

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that is using the tokens of owner
     * @param {number} amount Amount of the tokens that will be used
     * @returns {Promise<TransactionSignerInterface>} Transaction signer interface
     */
    approve: (owner: string, spender: string, amount: number) => Promise<TransactionSignerInterface>
}

export interface NftInterface
    extends Omit<AssetInterface, 'transfer' | 'getName' | 'getSymbol'>,
        ContractInterface {
    /**
     * @returns {Promise<string>} Name of the asset (long name)
     */
    getName: () => Promise<string>

    /**
     * @returns {Promise<string>} Symbol of the asset (short name)
     */
    getSymbol: () => Promise<string>

    /**
     * @param {number | string} nftId ID of the NFT
     * @returns  {Promise<string>} Wallet address of owner of the NFT
     */
    getOwner: (nftId: number | string) => Promise<string>

    /**
     * @param {number | string} nftId ID of the NFT
     * @returns {Promise<string>} URL of the metadata
     */
    getTokenURI: (nftId: number | string) => Promise<string>

    /**
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @returns {Promise<string | null>} Amount of the tokens that is being used by spender
     */
    getApproved: (nftId: number | string) => Promise<string | null>

    /**
     * Transfers an NFT
     * @param {string} sender Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @override transfer() in AssetInterface
     * @returns {Promise<TransactionSignerInterface>} Transaction signer interface
     */
    transfer: (
        sender: string,
        receiver: string,
        nftId: number | string
    ) => Promise<TransactionSignerInterface>

    /**
     * @param {string} spender Address of the spender of transaction
     * @param {string} owner Address of owner of the nfts that will be used
     * @param {string} receiver Address of the receiver that will receive the nfts
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSignerInterface>} Transaction signer interface
     */
    transferFrom: (
        spender: string,
        owner: string,
        receiver: string,
        nftId: number | string
    ) => Promise<TransactionSignerInterface>

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number | string} nftId ID of the NFT that will be transferred
     */
    approve: (
        owner: string,
        spender: string,
        nftId: number | string
    ) => Promise<TransactionSignerInterface>
}
