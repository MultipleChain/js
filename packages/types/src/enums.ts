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
    ASSET = 'ASSET',
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
