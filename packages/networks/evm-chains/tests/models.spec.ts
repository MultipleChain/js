import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction.ts'

const txId = '0x566002399664e92f82ed654c181095bdd7ff3d3f1921d963257585891f622251'

describe('Tests for models', () => {
    const tx = new Transaction(txId)
    it('Transaction Id', async () => {
        expect(tx.getId()).toBe(txId)
    })

    it('Transaction Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })
})
