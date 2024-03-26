import { toHex } from 'web3-utils'
import BigNumber from 'bignumber.js'

const BASE58_ALPHABET: string = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Converts the decimal to hexadecimal
 */
export const numberToHex = (value: number | string | BigNumber, decimals: number): string => {
    const length = '1' + '0'.repeat(decimals)
    const newValue = new BigNumber(value.toString(10), 10)
    return toHex(newValue.times(length).toString(16))
}

/**
 * Converts the hexadecimal to decimal
 */
export const hexToNumber = (value: string, decimals: number): number => {
    const length = '1' + '0'.repeat(decimals)
    const newValue = new BigNumber(value.toString(), 10)
    return parseFloat(newValue.dividedBy(length).toString())
}

/**
 * Converts the given data to Base58 string. Given data may be string or an Uint8Array
 * If the given data is a string, it'll be converted to Uint8Array inside of the method
 */
export const base58Encode = (input: Uint8Array | string): string => {
    // Convert input to bytes if it's a string
    if (typeof input === 'string') input = new Uint8Array(Buffer.from(input))

    const base58Array: string[] = []

    // Convert the byte array to a BigInt
    let value = BigInt('0x' + Buffer.from(input).toString('hex'))

    // Base58 encoding
    while (value > BigInt(0)) {
        const remainder = Number(value % BigInt(58))
        base58Array.unshift(BASE58_ALPHABET[remainder])
        value = value / BigInt(58)
    }

    // Add '1' characters for leading zero bytes
    for (let i = 0; i < input.length; i++) {
        if (input[i] !== 0) break
        base58Array.unshift(BASE58_ALPHABET[0])
    }

    return base58Array.join('')
}

/**
 * Converts the given string to Base58 as an Uint8Array
 */
export const base58Decode = (input: string): Uint8Array => {
    let value = BigInt(0)

    for (let i = 0; i < input.length; i++)
        value = value * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(input[i]))

    const valueHex: string = value.toString(16)

    // Make the string's length even
    const hexString = valueHex.length % 2 === 0 ? valueHex : '0' + valueHex

    return new Uint8Array(Buffer.from(hexString, 'hex'))
}

/**
 * Converts the given buffer to a string
 */
export const bufferToString = (input: Buffer): string => {
    return Buffer.from(input).toString('utf8')
}

/**
 * Converts the given string to a buffer
 */
export const stringToBuffer = (input: string): Buffer => {
    return Buffer.from(input, 'utf8')
}

/**
 * Checks if given value is numeric
 */
export const isNumeric = (value: string | number): boolean => {
    return !isNaN(Number(value))
}

/**
 * Get the number of decimal places
 */
export const getDecimalPlaces = (num: number): number => {
    const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/)
    if (match === null) {
        return num
    } else {
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] !== undefined && match[1] !== null ? match[1].length : 0) -
                // Adjust for scientific notation.
                (match[2] !== undefined && match[2] !== null ? +match[2] : 0)
        )
    }
}

export const fixFloat = (num: number): number => {
    return parseFloat(num.toFixed(getDecimalPlaces(num)))
}

export const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms))
}

export { toHex }
