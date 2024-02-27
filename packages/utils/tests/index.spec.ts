import { describe, it, expect } from 'vitest'
import { toHex, numberToHex, hexToNumber, base58Encode, base58Decode, bufferToString, stringToBuffer } from '../src/index.js'

describe('Helper methods', () => {
    it('toHex', () => {
        expect(toHex(10)).toBe('0xa')
    })

    it('numberToHex', () => {
        expect(numberToHex(10, 18)).toBe('0x8ac7230489e80000')
    })

    it('hexToNumber', () => {
        expect(hexToNumber('0x8ac7230489e80000', 18)).toBe(10)
    })

    it('base58Encode', () => {
        expect(base58Encode('7bWpTW')).toBe('Uad4z3ti')
    })

    it('base58Encode', () => {
        expect(base58Encode(new Uint8Array([55, 98, 87, 112, 84, 87]))).toBe('Uad4z3ti')
    })

    it('base58Decode', () => {
        expect(base58Decode('Uad4z3ti')).toStrictEqual(new Uint8Array([55, 98, 87, 112, 84, 87]))
    })

    it('bufferToString', () => {
        expect(bufferToString(Buffer.from([101, 120, 97, 109, 112, 108, 101]))).toBe('example')
    })

    it('stringToBuffer', () => {
        expect(stringToBuffer('example')).toStrictEqual(Buffer.from([101, 120, 97, 109, 112, 108, 101]))
    })
})
