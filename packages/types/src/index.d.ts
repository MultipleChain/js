declare module "enums" {
    /**
     * Asset transactions (COIN, TOKEN, NFT) has two directions
     */
    export enum AssetDirectionEnum {
        INCOMING = 0,
        OUTGOING = 1
    }
    /**
     * There are six types of transactions at the moment.
     * COIN, TOKEN, and NFT transactions are called ASSET transactions
     */
    export enum TransactionTypeEnum {
        GENERAL = 0,
        CONTRACT = 1,
        ASSET = 2,
        COIN = 3,
        TOKEN = 4,
        NFT = 5
    }
    /**
     * There are 3 available transaction statuses:
     * FAILED    --> When a transaction is failed
     * PENDING   --> When a transaction has not been concluded
     * CONFIRMED --> When a transaction is confirmed
     */
    export enum TransactionStatusEnum {
        FAILED = 0,
        PENDING = 1,
        CONFIRMED = 2
    }
}
declare module "models" {
    import type { AssetDirectionEnum, TransactionStatusEnum } from "enums";
    export interface TransactionInterface {
        /**
         * Each transaction has its own unique ID defined by the user
         */
        id: string;
        /**
         * @param id - Transaction id from the blockchain network
         * This can be different names like txid, hash, signature etc.
         */
        constructor: (id: string) => void;
        /**
         * @returns Raw transaction data that is taken by blockchain network via RPC.
         */
        getData: () => object;
        /**
         * @returns Transaction id from the blockchain network
         * this can be different names like txid, hash, signature etc.
         */
        getId: () => string;
        /**
         * @returns Blockchain explorer URL of the transaction. Dependant on network.
         */
        getUrl: () => string;
        /**
         * @returns Wallet address of the sender of transaction
         */
        getSender: () => string;
        /**
         * @returns Transaction fee as native coin amount
         */
        getFee: () => number;
        /**
         * @returns Block ID of the transaction
         */
        getBlockNumber: () => number;
        /**
         * @returns UNIX timestamp of the date that block is added to blockchain
         */
        getBlockTimestamp: () => number;
        /**
         * @returns Block confirmation amount
         */
        getBlockConfirmationCount: () => number;
        /**
         * @returns Status of the transaction.
         */
        getStatus: () => TransactionStatusEnum;
    }
    export interface ContractTransactionInterface extends TransactionInterface {
        /**
         * @returns Smart contract address of the transaction
         */
        getAddress: () => string;
    }
    export interface AssetTransactionInterface extends TransactionInterface {
        /**
         * @returns Receiver wallet address of the transaction (asset)
         */
        getReceiver: () => string;
        /**
         * @param direction - Direction of the transaction (asset)
         * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
         * @param amount Amount of assets that will be transferred
         */
        verifyTransfer: (direction: AssetDirectionEnum, address: string, amount: number) => TransactionStatusEnum;
    }
    export interface CoinTransactionInterface extends AssetTransactionInterface {
        /**
         * @returns Transfer amount of the transaction (coin)
         */
        getAmount: () => number;
    }
    export interface TokenTransactionInterface extends AssetTransactionInterface, ContractTransactionInterface {
        /**
         * @param direction - Direction of the transaction (token)
         * @param address - Wallet address of the owner or spender of the transaction, dependant on direction
         */
        verifyApprove: (direction: AssetDirectionEnum, address: string, amount: number) => TransactionStatusEnum;
    }
    export interface NftTransactionInterface extends Omit<AssetTransactionInterface, 'verifyTransfer'>, ContractTransactionInterface {
        /**
         * @returns ID of the NFT
         */
        getNftId: () => number;
        /**
         * @param direction - Direction of the transaction (nft)
         * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
         * @param nftId ID of the NFT that will be transferred
         * @override verifyTransfer() in AssetTransactionInterface
         */
        verifyTransfer: (direction: AssetDirectionEnum, address: string, nftId: number) => TransactionStatusEnum;
    }
}
declare module "services/TransactionSignerInterface" {
    import type { TransactionInterface } from "models";
    /**
     * "any" is dependent on the blockchain network, it can be a string, object or any other type
     * so, you need define the type of the transaction data in your implementation
     */
    export interface TransactionSignerInterface {
        /**
         * Transaction data from the blockchain network
         */
        transaction: any;
        /**
         * @param transaction - Transaction data from the blockchain network
         */
        constructor: (transaction: any) => void;
        /**
         * @param privateKey - Private key of the wallet to sign the transaction
         */
        sign: (privateKey: string) => TransactionSignerInterface;
        /**
         * @returns Send the transaction to the blockchain network, returns a promise of the transaction
         */
        send: () => Promise<TransactionInterface | Error>;
        /**
         * @returns Unsigned transaction raw data
         */
        getRawData: () => any;
        /**
         * @returns Signed transaction data
         */
        getSignedData: () => any;
    }
}
declare module "assets" {
    import type { TransactionSignerInterface } from "services/TransactionSignerInterface";
    /**
     * There are 2 comprehensive interfaces: AssetInterface, ContractInterface
     * Other interfaces have more pinpoint purposes: CoinInterface, TokenInterface, NftInterface
     */
    export interface ContractInterface {
        /**
         * Given contract address
         */
        address: string;
        /**
         * @param address Contract address
         */
        constructor: (address: string) => void;
        /**
         * @returns Contract address given in constructor() as param
         */
        getAddress: () => string;
        /**
         * Runs the contract methods dynamically
         */
        callMethod: (...args: any[]) => any;
        /**
         * To get information from called method
         * @returns Data used in transaction
         */
        getMethodData: (...args: any[]) => any;
    }
    export interface AssetInterface {
        /**
         * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
         * @param sender Sender wallet address
         * @param receiver Receiver wallet address
         * @param amount Amount of assets that will be transferred
         */
        transfer: (sender: string, receiver: string, amount: number) => TransactionSignerInterface;
        /**
         * @returns Name of the asset (long name)
         */
        getName: () => string;
        /**
         * @returns Symbol of the asset (short name)
         */
        getSymbol: () => string;
        /**
         * @param owner Address of the wallet
         * @returns Wallet balance as currency of TOKEN or COIN assets
         */
        getBalance: (owner: string) => number;
    }
    export interface CoinInterface extends AssetInterface {
        /**
         * @returns Decimal value of the coin
         */
        getDecimals: () => number;
    }
    export interface TokenInterface extends AssetInterface, ContractInterface {
        /**
         * @returns Decimal value of the token
         */
        getDecimals: () => number;
        /**
         * @returns Total supply of the token
         */
        getTotalSupply: () => number;
        /**
         * Gives permission to the spender to spend owner's tokens
         * @param owner Address of owner of the tokens that will be used
         * @param spender Address of the spender that will use the tokens of owner
         * @param amount Amount of the tokens that will be used
         */
        approve: (owner: string, spender: string, amount: number) => TransactionSignerInterface;
        /**
         * @param owner Address of owner of the tokens that is being used
         * @param spender Address of the spender that is using the tokens of owner
         * @returns Amount of the tokens that is being used by spender
         */
        allowance: (owner: string, spender: string) => number;
    }
    export interface NftInterface extends Omit<AssetInterface, 'transfer'>, ContractInterface {
        /**
         * Transfers an NFT
         * @param sender Sender wallet address
         * @param receiver Receiver wallet address
         * @param nftId ID of the NFT that will be transferred
         * @override transfer() in AssetInterface
         */
        transfer: (sender: string, receiver: string, nftId: number) => TransactionSignerInterface;
        /**
         * @param nftId ID of the NFT
         * @returns Wallet address of owner of the NFT
         */
        getOwner: (nftId: number) => string;
        /**
         * @param nftId ID of the NFT
         * @returns URL of the metadata
         */
        getTokenURI: (nftId: number) => string | URL;
    }
}
declare module "services/ProviderInterface" {
    /**
     * wsUrl: Websocket URL
     * rpcUrl: RPC URL of the blockchain network
     * testnet: @default true
     */
    export interface NetworkConfigInterface {
        wsUrl?: string;
        rpcUrl?: string;
        testnet?: boolean;
    }
    export interface ProviderInterface {
        /**
         * Network configuration of the provider
         */
        network: NetworkConfigInterface;
        /**
         * @param config - Network configuration of the provider
         */
        constructor: (config: NetworkConfigInterface) => void;
        /**
         * Update network configuration of the provider
         */
        update: (config: NetworkConfigInterface) => void;
    }
}
declare module "services/TransactionListenerInterface" {
    import type { TransactionInterface, ContractTransactionInterface, AssetTransactionInterface, CoinTransactionInterface, TokenTransactionInterface, NftTransactionInterface } from "models";
    import type { TransactionTypeEnum, AssetDirectionEnum } from "enums";
    /**
     * Filter types for each transaction type in TransactionListenerInterface
     */
    interface TransactionListenerFilterInterface {
        sender?: string;
    }
    interface ContractTransactionListenerFilterInterface extends TransactionListenerFilterInterface {
        address?: string;
    }
    interface AssetTransactionListenerFilterInterface extends TransactionListenerFilterInterface {
        receiver?: string;
        direction?: AssetDirectionEnum;
    }
    interface CoinTransactionListenerFilterInterface extends AssetTransactionListenerFilterInterface {
        amount?: string;
    }
    interface TokenTransactionListenerFilterInterface extends AssetTransactionListenerFilterInterface, ContractTransactionListenerFilterInterface {
        amount?: number;
    }
    interface NftTransactionListenerFilterInterface extends AssetTransactionListenerFilterInterface, ContractTransactionListenerFilterInterface {
        nftId?: string;
    }
    /**
     * Filter types for each transaction type in TransactionListenerInterface
     */
    /**
     * 'DynamicTransactionType' connects transaction types to their corresponding transaction interfaces
     * Every type of transaction has its own unique transaction interface.
     * A sender's wallet address is a common value.
     */
    export type DynamicTransactionType<T extends TransactionTypeEnum> = T extends TransactionTypeEnum.GENERAL ? TransactionInterface : T extends TransactionTypeEnum.CONTRACT ? ContractTransactionInterface : T extends TransactionTypeEnum.ASSET ? AssetTransactionInterface : T extends TransactionTypeEnum.COIN ? CoinTransactionInterface : T extends TransactionTypeEnum.TOKEN ? TokenTransactionInterface : T extends TransactionTypeEnum.NFT ? NftTransactionInterface : never;
    /**
     * 'DynamicTransactionListenerFilterInterface' connects transaction types to their corresponding filter interfaces
     * Every type of transaction has its own unique filter values.
     * A sender's wallet address is a common value.
     */
    export type DynamicTransactionListenerFilterType<T extends TransactionTypeEnum> = T extends TransactionTypeEnum.GENERAL ? TransactionListenerFilterInterface : T extends TransactionTypeEnum.CONTRACT ? ContractTransactionListenerFilterInterface : T extends TransactionTypeEnum.ASSET ? AssetTransactionListenerFilterInterface : T extends TransactionTypeEnum.COIN ? CoinTransactionListenerFilterInterface : T extends TransactionTypeEnum.TOKEN ? TokenTransactionListenerFilterInterface : T extends TransactionTypeEnum.NFT ? NftTransactionListenerFilterInterface : never;
    export interface TransactionListenerInterface<T extends TransactionTypeEnum> {
        /**
         * The 'type' property is a generic type that is used to define the type of transaction listener.
         */
        type: T;
        /**
         * 'filter' is an object that has values depending on transaction listener type.
         * E.g. no matter which type of transaction is listening, 'filter' has to have a 'sender' value
         */
        filter?: DynamicTransactionListenerFilterType<T>;
        /**
         * stop() method closes the corresponding listener of the instance it's called from.
         */
        stop: () => void;
        on: (event: (transaction: DynamicTransactionType<T>) => void) => void;
        /**
         * listener methods for each transaction type
         */
        generalTransactionProcess: () => void;
        contractTransactionProcess: () => void;
        assetTransactionProcess: () => void;
        coinTransactionProcess: () => void;
        tokenTransactionProcess: () => void;
        nftTransactionProcess: () => void;
    }
}
declare module "index" {
    export type * from "assets";
    export type * from "enums";
    export type * from "models";
    export type * from "services/ProviderInterface";
    export type * from "services/TransactionListenerInterface";
    export type * from "services/TransactionSignerInterface";
}
