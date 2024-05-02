import { describe, it, expect, assert } from 'vitest'

import { Coin } from '../src/assets/Coin.ts'
import { math } from '@multiplechain/utils'
import { Transaction } from '../src/models/Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner.ts'

const coinBalanceTestAmount = Number(process.env.TRON_COIN_BALANCE_TEST_AMOUNT)
const tokenBalanceTestAmount = Number(process.env.TRON_TOKEN_BALANCE_TEST_AMOUNT)
const nftBalanceTestAmount = Number(process.env.TRON_NFT_BALANCE_TEST_AMOUNT)
const transferTestAmount = Number(process.env.TRON_TRANSFER_TEST_AMOUNT)
const tokenTransferTestAmount = Number(process.env.TRON_TOKEN_TRANSFER_TEST_AMOUNT)
const tokenApproveTestAmount = Number(process.env.TRON_TOKEN_APPROVE_TEST_AMOUNT)
const nftTransferId = Number(process.env.TRON_NFT_TRANSFER_ID)

const coinTransferTestIsActive = Boolean(process.env.TRON_COIN_TRANSFER_TEST_IS_ACTIVE !== 'false')
const tokenTransferTestIsActive = Boolean(
    process.env.TRON_TOKEN_TRANSFER_TEST_IS_ACTIVE !== 'false'
)
const tokenApproveTestIsActive = Boolean(process.env.TRON_TOKEN_APPROVE_TEST_IS_ACTIVE !== 'false')
const nftTransactionTestIsActive = Boolean(
    process.env.TRON_NFT_TRANSACTION_TEST_IS_ACTIVE !== 'false'
)
const tokenTransferFromTestIsActive = Boolean(
    process.env.TRON_TOKEN_TRANSFER_FROM_TEST_IS_ACTIVE !== 'false'
)

const balanceTestAddress = String(process.env.TRON_BALANCE_TEST_ADDRESS)
const senderPrivateKey = String(process.env.TRON_SENDER_PRIVATE_KEY)
const receiverPrivateKey = String(process.env.TRON_RECEIVER_PRIVATE_KEY)
const senderTestAddress = String(process.env.TRON_SENDER_TEST_ADDRESS)
const receiverTestAddress = String(process.env.TRON_RECEIVER_TEST_ADDRESS)
const tokenTestAddress = String(process.env.TRON_TOKEN_TEST_ADDRESS)
const nftTestAddress = String(process.env.TRON_NFT_TEST_ADDRESS)

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey)

    assert.isObject(signer.getSignedData())
}

const checkTx = async (transaction: Transaction): Promise<any> => {
    expect(transaction).toBeInstanceOf(Transaction)
    const status = await transaction.wait(10 * 1000)
    expect(status).toBe(TransactionStatusEnum.CONFIRMED)
}

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('Tron')
        expect(coin.getSymbol()).toBe('TRX')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(6)
    })

    it('Balance', async () => {
        const balance = await coin.getBalance(balanceTestAddress)
        expect(balance).toBe(coinBalanceTestAmount)
    })

    it('Transfer', async () => {
        if (!coinTransferTestIsActive) return

        const signer = await coin.transfer(
            senderTestAddress,
            receiverTestAddress,
            transferTestAmount
        )

        await checkSigner(signer)

        const beforeBalance = await coin.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await coin.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, transferTestAmount))
    })
})
