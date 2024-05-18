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

describe('Token', async () => {
    const token = new Token(tokenTestAddress)
    const token2022 = new Token(token2022TestAddress)

    it('Name and symbol', async () => {
        expect(await token.getName()).toBe('Example')
        expect(await token.getSymbol()).toBe('EXM')
        expect(await token2022.getName()).toBe('Example Token 2022')
        expect(await token2022.getSymbol()).toBe('EXM2')
    })

    it('Decimals', async () => {
        expect(await token.getDecimals()).toBe(8)
        expect(await token2022.getDecimals()).toBe(9)
    })

    it('Balance', async () => {
        expect(await token.getBalance(balanceTestAddress)).toBe(tokenBalanceTestAmount)
        expect(await token2022.getBalance(balanceTestAddress)).toBe(tokenBalanceTestAmount)
    })

    it('Total supply', async () => {
        expect(await token.getTotalSupply()).toBe(100000000000)
        expect(await token2022.getTotalSupply()).toBe(10000000)
    })

    it('Transfer', async () => {
        const signer = await token.transfer(
            senderTestAddress,
            receiverTestAddress,
            tokenTransferTestAmount
        )

        await checkSigner(signer)

        if (!tokenTransferTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        const beforeBalance = await token.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, tokenTransferTestAmount))
    })

    it('Transfer 2022', async () => {
        const signer = await token2022.transfer(
            senderTestAddress,
            receiverTestAddress,
            tokenTransferTestAmount
        )

        await checkSigner(signer)

        if (!tokenTransferTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        const beforeBalance = await token2022.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token2022.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, tokenTransferTestAmount))
    })

    it('Approve and Allowance', async () => {
        const signer = await token.approve(
            senderTestAddress,
            receiverTestAddress,
            tokenApproveTestAmount
        )

        await checkSigner(signer)

        if (!tokenApproveTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        await checkTx(await signer.send())

        expect(await token.getAllowance(senderTestAddress, receiverTestAddress)).toBe(
            tokenApproveTestAmount
        )
    })

    it('Approve and Allowance 2022', async () => {
        const signer = await token2022.approve(
            senderTestAddress,
            receiverTestAddress,
            tokenApproveTestAmount
        )

        await checkSigner(signer)

        if (!tokenApproveTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        await checkTx(await signer.send())

        expect(await token.getAllowance(senderTestAddress, receiverTestAddress)).toBe(
            tokenApproveTestAmount
        )
    })

    it('Transfer from', async () => {
        const signer = await token.transferFrom(
            receiverTestAddress,
            senderTestAddress,
            receiverTestAddress,
            2
        )

        await checkSigner(signer, receiverPrivateKey)

        if (!tokenTransferFromTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        const beforeBalance = await token.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, 2))
    })

    it('Transfer from 2022', async () => {
        const signer = await token2022.transferFrom(
            receiverTestAddress,
            senderTestAddress,
            receiverTestAddress,
            2
        )

        await checkSigner(signer, receiverPrivateKey)

        if (!tokenTransferFromTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        const beforeBalance = await token2022.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token2022.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, 2))
    })
})
