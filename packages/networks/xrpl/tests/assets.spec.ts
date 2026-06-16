import { describe, it, expect, assert } from 'vitest'

import './setup'
import { Coin } from '../src/assets/Coin'
import { math } from '@multiplechain/utils'
import { Transaction } from '../src/models/Transaction'
import { TransactionStatusEnum, type TransactionId } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner'
import { ECDSA } from 'xrpl'
import {
    balanceTestAddress,
    coinBalanceTestAmount,
    receiverTestAddress,
    senderTestAddress,
    transferTestAmount
} from './fixtures'

const senderPrivateKey = String(process.env.XRP_SENDER_PRIVATE_KEY)
const transferTestIsActive = Boolean(process.env.XRP_TRANSFER_TEST_IS_ACTIVE !== 'false')

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey, ECDSA.secp256k1)

    assert.isObject(signer.getSignedData())
}

const checkTx = async (transactionId: TransactionId): Promise<any> => {
    const transaction = new Transaction(transactionId)
    const status = await transaction.wait(10 * 1000)
    expect(status).toBe(TransactionStatusEnum.CONFIRMED)
}

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('XRP')
        expect(coin.getSymbol()).toBe('XRP')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(6)
    })

    it('Balance', async () => {
        const balance = await coin.getBalance(balanceTestAddress)
        expect(balance).toBe(coinBalanceTestAmount)
    })

    it('Transfer', async () => {
        const signer = await coin.transfer(senderTestAddress, receiverTestAddress, transferTestAmount)

        await checkSigner(signer)

        if (!transferTestIsActive) return

        const beforeBalance = await coin.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await coin.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, transferTestAmount))
    })
})
