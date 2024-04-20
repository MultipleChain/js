import { Wallet } from './Wallet.ts'
import * as adapters from './adapters/index.ts'

export * from '../index.ts'

export const browser = {
    Wallet,
    adapters
}
