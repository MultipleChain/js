import { describe, it, expect } from 'vitest'

import ERC20 from '../resources/erc20.json'
import { Transaction } from '../src/models/Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { ContractTransaction } from '../src/models/ContractTransaction.ts'

const etherTransferTx = '0x566002399664e92f82ed654c181095bdd7ff3d3f1921d963257585891f622251'
const tokenTransferTx = '0xdabda3905e585db91768f2ef877f7fbef7c0e8612c0a09c7b379981bdbc48975'

describe('Transaction', () => {
    const tx = new Transaction(etherTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(etherTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe(
            'https://sepolia.etherscan.io/tx/0x566002399664e92f82ed654c181095bdd7ff3d3f1921d963257585891f622251'
        )
    })

    it('Sender', async () => {
        expect(await tx.getSender()).toBe('0x74dBE9cA4F93087A27f23164d4367b8ce66C33e2')
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.000371822357865)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(5461884)
    })

    // Not give any response in vitest environment
    // it('Block Timestamp', async () => {
    //     expect(await tx.getBlockTimestamp()).toBe(1710141144)
    // })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(129954)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Contract Transaction', () => {
    const tx = new ContractTransaction(tokenTransferTx)

    it('Address', async () => {
        expect((await tx.getAddress()).toLowerCase()).toBe(
            '0x4294cb0dD25dC9140B5127f247cBd47Eeb673431'.toLowerCase()
        )
    })

    it('Decode Data', async () => {
        const result = await tx.decodeData(ERC20)
        expect(result?.args[0]).toBe('0xbBa4d06D1cEf94b35aDeCfDa893523907fdD36DE')
    })
})
