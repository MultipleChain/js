import { toHex } from 'web3-utils'
import BigNumber from 'bignumber.js'

const BASE58_ALPHABET: string = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

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

export const base58Decode = (input: string): Uint8Array => {
    let value = BigInt(0)

    for (let i = 0; i < input.length; i++)
        value = value * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(input[i]))

    const valueHex: string = value.toString(16)

    // Make the string's length even
    const hexString = valueHex.length % 2 === 0 ? valueHex : '0' + valueHex

    return new Uint8Array(Buffer.from(hexString, 'hex'))
}

export const bufferToString = (input: Buffer): string => {
    return Buffer.from(input).toString('utf8')
}

export const stringToBuffer = (input: string): Buffer => {
    return Buffer.from(input, 'utf8')
}

export const isNumeric = (value: string | number): boolean => {
    return !isNaN(Number(value))
}

export { toHex }
