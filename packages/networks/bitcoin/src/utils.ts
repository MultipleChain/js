import { math } from '@multiplechain/utils'

export * from '@multiplechain/utils'

export const fromSatoshi = (amount: number): number => {
    return math.div(amount, 100000000, 8)
}

export const toSatoshi = (amount: number): number => {
    return math.mul(amount, 100000000, 8)
}
