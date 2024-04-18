/**
 * Asset transactions (COIN, TOKEN, NFT) has two directions
 */
export enum AssetDirectionEnum {
    INCOMING = 'INCOMING',
    OUTGOING = 'OUTGOING'
}

/**
 * There are six types of transactions at the moment.
 * COIN, TOKEN, and NFT transactions are called ASSET transactions
 */
export enum TransactionTypeEnum {
    GENERAL = 'GENERAL',
    CONTRACT = 'CONTRACT',
    COIN = 'COIN',
    TOKEN = 'TOKEN',
    NFT = 'NFT'
}

/**
 * There are 3 available transaction statuses:
 * FAILED    --> When a transaction is failed
 * PENDING   --> When a transaction has not been concluded
 * CONFIRMED --> When a transaction is confirmed
 */
export enum TransactionStatusEnum {
    FAILED = 'FAILED',
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED'
}

export enum ErrorTypeEnum {
    RPC_TIMEOUT = 'RPC_TIMEOUT',
    RPC_REQUEST_ERROR = 'RPC_REQUEST_ERROR',
    RPC_ACCESS_DENIED = 'RPC_ACCESS_DENIED',
    UNACCEPTED_CHAIN = 'UNACCEPTED_CHAIN',
    UNAUTHORIZED_ADDRESS = 'UNAUTHORIZED_ADDRESS',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    INVALID_ADDRESS = 'INVALID_ADDRESS',
    INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
    INVALID_PUBLIC_KEY = 'INVALID_PUBLIC_KEY',
    INVALID_TRANSACTION_ID = 'INVALID_TRANSACTION_ID',
    PROVIDER_IS_NOT_INITIALIZED = 'PROVIDER_IS_NOT_INITIALIZED',
    PROVIDER_IS_ALREADY_INITIALIZED = 'PROVIDER_IS_ALREADY_INITIALIZED',
    WALLET_ALREADY_PROCESSING = 'WALLET_ALREADY_PROCESSING',
    WALLET_CONNECT_REJECTED = 'WALLET_CONNECT_REJECTED',
    WALLET_REQUEST_REJECTED = 'WALLET_REQUEST_REJECTED',
    WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
    WALLET_CONNECTION_TIMEOUT = 'WALLET_CONNECTION_TIMEOUT',
    TRANSACTION_CREATION_FAILED = 'TRANSACTION_CREATION_FAILED',
    CLOSED_WALLETCONNECT_MODAL = 'CLOSED_WALLETCONNECT_MODAL'
}

export enum WalletPlatformEnum {
    BROWSER = 'BROWSER',
    MOBILE = 'MOBILE',
    DESKTOP = 'DESKTOP',
    ALL = 'ALL'
}
