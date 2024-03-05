import { AssetTransaction } from './AssetTransaction.ts'
import type { CoinTransactionInterface } from '@multiplechain/types'

export class CoinTransaction extends AssetTransaction implements CoinTransactionInterface {}
