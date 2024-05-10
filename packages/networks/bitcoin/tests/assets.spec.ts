import { describe, it, expect, assert } from 'vitest'

import { Coin } from '../src/assets/Coin.ts'
import { math } from '@multiplechain/utils'
import { Transaction } from '../src/models/Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner.ts'

const testAmount = Number(process.env.BTC_TRANSFER_AMOUNT)
const senderTestAddress = String(process.env.BTC_SENDER_ADDRESS)
const receiverTestAddress = String(process.env.BTC_RECEIVER_ADDRESS)
const senderPrivateKey = String(process.env.BTC_SENDER_PRIVATE_KEY)
const transferTestIsActive = Boolean(process.env.BTC_TRANSFER_TEST_IS_ACTIVE !== 'false')

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey)

    assert.isString(signer.getSignedData())
}

const checkTx = async (transaction: Transaction): Promise<any> => {
    expect(transaction).toBeInstanceOf(Transaction)
    const status = await transaction.wait(10 * 1000)
    expect(status).toBe(TransactionStatusEnum.CONFIRMED)
}

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('Bitcoin')
        expect(coin.getSymbol()).toBe('BTC')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(8)
    })

    it('Balance', async () => {
        const balance = await coin.getBalance('tb1qc240vx54n08hnhx8l4rqxjzcxf4f0ssq5asawm')
        expect(balance).toBe(0.00003)
    })

    it('Transfer', async () => {
        const signer = await coin.transfer(senderTestAddress, receiverTestAddress, testAmount)

        await checkSigner(signer)

        if (!transferTestIsActive) return

        const beforeBalance = await coin.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await coin.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, testAmount))
    })
})
