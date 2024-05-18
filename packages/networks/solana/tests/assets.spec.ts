import { describe, it, expect, assert } from 'vitest'

import { NFT } from '../src/assets/NFT.ts'
import { Coin } from '../src/assets/Coin.ts'
import { Token } from '../src/assets/Token.ts'
import { math } from '@multiplechain/utils'
import { Transaction } from '../src/models/Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner.ts'

const coinBalanceTestAmount = Number(process.env.SOL_COIN_BALANCE_TEST_AMOUNT)
const tokenBalanceTestAmount = Number(process.env.SOL_TOKEN_BALANCE_TEST_AMOUNT)
const nftBalanceTestAmount = Number(process.env.SOL_NFT_BALANCE_TEST_AMOUNT)
const transferTestAmount = Number(process.env.SOL_TRANSFER_TEST_AMOUNT)
const tokenTransferTestAmount = Number(process.env.SOL_TOKEN_TRANSFER_TEST_AMOUNT)
const tokenApproveTestAmount = Number(process.env.SOL_TOKEN_APPROVE_TEST_AMOUNT)
const nftTransferId = Number(process.env.SOL_NFT_TRANSFER_ID)

const coinTransferTestIsActive = Boolean(process.env.SOL_COIN_TRANSFER_TEST_IS_ACTIVE !== 'false')
const tokenTransferTestIsActive = Boolean(process.env.SOL_TOKEN_TRANSFER_TEST_IS_ACTIVE !== 'false')
const tokenApproveTestIsActive = Boolean(process.env.SOL_TOKEN_APPROVE_TEST_IS_ACTIVE !== 'false')
const nftTransactionTestIsActive = Boolean(
    process.env.SOL_NFT_TRANSACTION_TEST_IS_ACTIVE !== 'false'
)
const tokenTransferFromTestIsActive = Boolean(
    process.env.SOL_TOKEN_TRANSFER_FROM_TEST_IS_ACTIVE !== 'false'
)

const balanceTestAddress = String(process.env.SOL_BALANCE_TEST_ADDRESS)
const senderPrivateKey = String(process.env.SOL_SENDER_PRIVATE_KEY)
const receiverPrivateKey = String(process.env.SOL_RECEIVER_PRIVATE_KEY)
const senderTestAddress = String(process.env.SOL_SENDER_TEST_ADDRESS)
const receiverTestAddress = String(process.env.SOL_RECEIVER_TEST_ADDRESS)
const tokenTestAddress = String(process.env.SOL_TOKEN_TEST_ADDRESS)
const token2022TestAddress = String(process.env.SOL_TOKEN_2022_TEST_ADDRESS)
const nftTestAddress = String(process.env.SOL_NFT_TEST_ADDRESS)

const waitSecondsBeforeThanNewTx = async (seconds: number): Promise<any> => {
    return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey)

    expect(signer.getSignedData()).toBeInstanceOf(Buffer)
}

const checkTx = async (transaction: Transaction): Promise<any> => {
    expect(transaction).toBeInstanceOf(Transaction)
    const status = await transaction.wait(10 * 1000)
    expect(status).toBe(TransactionStatusEnum.CONFIRMED)
}

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('Solana')
        expect(coin.getSymbol()).toBe('SOL')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(9)
    })

    it('Balance', async () => {
        const balance = await coin.getBalance(balanceTestAddress)
        expect(balance).toBe(coinBalanceTestAmount)
    })

    it('Transfer', async () => {
        const signer = await coin.transfer(
            senderTestAddress,
            receiverTestAddress,
            transferTestAmount
        )

        await checkSigner(signer)

        if (!coinTransferTestIsActive) return

        const beforeBalance = await coin.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await coin.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, transferTestAmount))
    })
})
