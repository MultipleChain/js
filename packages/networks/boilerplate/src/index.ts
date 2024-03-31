import * as NFT from './assets/NFT.ts'
import * as Coin from './assets/Coin.ts'
import * as Token from './assets/Token.ts'
import * as Contract from './assets/Contract.ts'

import * as Transaction from './models/Transaction.ts'
import * as NftTransaction from './models/NftTransaction.ts'
import * as CoinTransaction from './models/CoinTransaction.ts'
import * as TokenTransaction from './models/TokenTransaction.ts'
import * as ContractTransaction from './models/ContractTransaction.ts'

export * as utils from '@multiplechain/utils'
export * as types from '@multiplechain/types'

export * as Provider from './services/Provider.ts'
export * as TransactionSigner from './services/TransactionSigner.ts'
export * as TransactionListener from './services/TransactionListener.ts'

export const assets = {
    NFT,
    Coin,
    Token,
    Contract
}

export const models = {
    Transaction,
    NftTransaction,
    CoinTransaction,
    TokenTransaction,
    ContractTransaction
}
