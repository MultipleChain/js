/**
 * Asset transactions (COIN, TOKEN, NFT) has two directions
 */
export enum AssetDirectionEnum {
    INCOMING,
    OUTGOING
}

/**
 * There are six types of transactions at the moment.
 * COIN, TOKEN, and NFT transactions are called ASSET transactions
 */
export enum TransactionTypeEnum {
    GENERAL,
    CONTRACT,
    ASSET,
    COIN,
    TOKEN,
    NFT
}

/**
 * There are 3 available transaction statuses:
 * FAILED    --> When a transaction is failed
 * PENDING   --> When a transaction has not been concluded
 * CONFIRMED --> When a transaction is confirmed
 */
export enum TransactionStatusEnum {
    FAILED,
    PENDING,
    CONFIRMED
}
