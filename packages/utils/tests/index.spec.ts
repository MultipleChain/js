import { describe, it, expect } from 'vitest'
import { toHex, numberToHex, hexToNumber } from '../src/index.js'

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
})
