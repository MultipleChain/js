import { math } from '@multiplechain/utils'
import { MIST_PER_SUI, SUI_DECIMALS } from '@mysten/sui/utils'

export * from '@multiplechain/utils'

export const fromMist = (amount: number | string): number => {
    return math.div(Number(amount), Number(MIST_PER_SUI), SUI_DECIMALS)
}

export const tomMist = (amount: number): number => {
    return math.mul(amount, Number(MIST_PER_SUI), SUI_DECIMALS)
}
