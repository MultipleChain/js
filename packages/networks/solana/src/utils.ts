import { math } from '@multiplechain/utils'

export * from '@multiplechain/utils'

export const fromLamports = (amount: number): number => {
    return math.div(amount, 1000000000, 9)
}

export const toLamports = (amount: number): number => {
    return math.mul(amount, 1000000000, 9)
}
