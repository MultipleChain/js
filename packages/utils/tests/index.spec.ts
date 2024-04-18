import { describe, it, expect } from 'vitest'
import {
    toHex,
    numberToHex,
    hexToNumber,
    base58Encode,
    base58Decode,
    bufferToString,
    stringToBuffer,
    math
} from '../src/index.js'

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
        expect(stringToBuffer('example')).toStrictEqual(
            Buffer.from([101, 120, 97, 109, 112, 108, 101])
        )
    })
})

describe('Math', () => {
    it('add', () => {
        expect(math.add(0.2, 0.1)).toBe(0.3)
    })

    it('subtract', () => {
        expect(math.sub(0.3, 0.1)).toBe(0.2)
    })

    it('multiply', () => {
        expect(math.mul(10, 20)).toBe(200)
    })

    it('divide', () => {
        expect(math.div(10, 20)).toBe(0.5)
    })

    it('pow', () => {
        expect(math.pow(2, 3)).toBe(8)
    })

    it('sqrt', () => {
        expect(math.sqrt(9)).toBe(3)
    })

    it('abs', () => {
        expect(math.abs(-10)).toBe(10)
    })

    it('ceil', () => {
        expect(math.ceil(0.1)).toBe(1)
    })

    it('floor', () => {
        expect(math.floor(0.9)).toBe(0)
    })

    it('round', () => {
        expect(math.round(0.5)).toBe(1)
    })
})
