import type { AssetDirectionEnum } from './enums.js'

export interface TransactionListenerFilterInterface {
    sender?: string
}

export interface ContractTransactionListenerFilterInterface
    extends TransactionListenerFilterInterface {
    address?: string
}

export interface AssetTransactionListenerFilterInterface
    extends TransactionListenerFilterInterface {
    receiver?: string
    direction?: AssetDirectionEnum
}

export interface CoinTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface {
    amount?: string
}

export interface TokenTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    amount?: number
}

export interface NftTransactionListenerFilterInterface
    extends AssetTransactionListenerFilterInterface,
        ContractTransactionListenerFilterInterface {
    nftId?: string
}
