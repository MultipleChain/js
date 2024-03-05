import { Asset } from './Asset.ts'
import type { CoinInterface } from '@multiplechain/types'

export class Coin extends Asset implements CoinInterface {
    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return 18
    }
}
