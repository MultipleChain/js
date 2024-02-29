import type TransactionInterface from './models/TransactionInterface.js'

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
     * @param address Contract address
     */
    constructor: (address: string) => void

    /**
     * @returns Contract address given in constructor() as param
     */
    getAddress: () => string

    /**
     * Runs the contract methods dynamically
     */
    callMethod: (...args: any[]) => any

    /**
     * To get information from called method
     * @returns Data used in transaction
     */
    getMethodData: (...args: any[]) => any
}

export interface AssetInterface {
    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    transfer: (sender: string, receiver: string, amount: number) => void

    /**
     * @returns Name of the asset (long name)
     */
    getName: () => string

    /**
     * @returns Symbol of the asset (short name)
     */
    getSymbol: () => string

    /**
     * @param owner Address of the wallet
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    getBalance: (owner: string) => number
}

// Sub Interfaces
export interface CoinInterface extends AssetInterface {
    /**
     * @returns Decimal value of the coin
     */
    getDecimals: () => number
}

export interface TokenInterface extends AssetInterface, ContractInterface {
    /**
     * @returns Decimal value of the token
     */
    getDecimals: () => number

    /**
     * @returns Total supply of the token
     */
    getTotalSupply: () => number

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param amount Amount of the tokens that will be used
     */
    approve: (owner: string, spender: string, amount: number) => TransactionInterface

    /**
     * @param owner Address of owner of the tokens that is being used
     * @param spender Address of the spender that is using the tokens of owner
     * @returns Amount of the tokens that is being used by spender
     */
    allowance: (owner: string, spender: string) => number
}

export interface NftInterface extends Omit<AssetInterface, 'transfer'>, ContractInterface {
    /**
     * Transfers an NFT
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param nftId ID of the NFT that will be transferred
     * @override transfer() in AssetInterface
     */
    transfer: (sender: string, receiver: string, nftId: number) => void

    /**
     * @param nftId ID of the NFT
     * @returns Wallet address of owner of the NFT
     */
    getOwner: (nftId: number) => string

    /**
     * @param nftId ID of the NFT
     * @returns URL of the metadata
     */
    getTokenURI: (nftId: number) => string | URL
}
