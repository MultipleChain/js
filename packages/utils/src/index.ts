import { toHex } from 'web3-utils'
import BigNumber from 'bignumber.js'

export const numberToHex = (value: number | string | BigNumber, decimals: number): string => {
    const length = '1' + '0'.repeat(decimals)
    const newValue = new BigNumber(value.toString(10), 10)
    return toHex(newValue.times(length).toString(16))
}

export const hexToNumber = (value: string, decimals: number): number => {
    const length = '1' + '0'.repeat(decimals)
    const newValue = new BigNumber(value.toString(), 10)
    return parseFloat(newValue.dividedBy(length).toString())
}

export const isNumeric = (value: string | number): boolean => {
    return !isNaN(Number(value))
}

export { toHex }
