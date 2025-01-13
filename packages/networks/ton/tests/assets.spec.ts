import { describe, it, expect, assert } from 'vitest'

import { NFT } from '../src/assets/NFT'
import { Coin } from '../src/assets/Coin'
import { Token } from '../src/assets/Token'
import { math } from '@multiplechain/utils'
import { Transaction } from '../src/models/Transaction'
import { TransactionStatusEnum, type TransactionId } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner'
import { Cell } from '@ton/core'

const coinBalanceTestAmount = Number(process.env.TON_COIN_BALANCE_TEST_AMOUNT)
const tokenBalanceTestAmount = Number(process.env.TON_TOKEN_BALANCE_TEST_AMOUNT)
const nftBalanceTestAmount = Number(process.env.TON_NFT_BALANCE_TEST_AMOUNT)
const transferTestAmount = Number(process.env.TON_TRANSFER_TEST_AMOUNT)
const tokenTransferTestAmount = Number(process.env.TON_TOKEN_TRANSFER_TEST_AMOUNT)
// const tokenApproveTestAmount = Number(process.env.TON_TOKEN_APPROVE_TEST_AMOUNT)
const nftTransferId = String(process.env.TON_NFT_TRANSFER_ID)
const nftBalanceId = String(process.env.TON_NFT_BALANCE_TEST_ID)

const coinTransferTestIsActive = Boolean(process.env.TON_COIN_TRANSFER_TEST_IS_ACTIVE !== 'false')
const tokenTransferTestIsActive = Boolean(process.env.TON_TOKEN_TRANSFER_TEST_IS_ACTIVE !== 'false')
// const tokenApproveTestIsActive = Boolean(process.env.TON_TOKEN_APPROVE_TEST_IS_ACTIVE !== 'false')
const nftTransactionTestIsActive = Boolean(
    process.env.TON_NFT_TRANSACTION_TEST_IS_ACTIVE !== 'false'
)
// const tokenTransferFromTestIsActive = Boolean(
//     process.env.TON_TOKEN_TRANSFER_FROM_TEST_IS_ACTIVE !== 'false'
// )

const balanceTestAddress = String(process.env.TON_BALANCE_TEST_ADDRESS)
const senderPrivateKey = String(process.env.TON_SENDER_SEED_PHRASE)
// const receiverPrivateKey = String(process.env.TON_RECEIVER_SEED_PHRASE)
const senderTestAddress = String(process.env.TON_SENDER_ADDRESS)
const receiverTestAddress = String(process.env.TON_RECEIVER_ADDRESS)
const tokenTestAddress = String(process.env.TON_TOKEN_TEST_ADDRESS)
const nftCollection = String(process.env.TON_NFT_COLLECTION)

const waitForSec = async (seconds: number): Promise<any> => {
    return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey)

    assert.instanceOf(signer.getSignedData(), Cell)
}

const checkTx = async (transactionId: TransactionId): Promise<Transaction> => {
    const transaction = new Transaction(transactionId)
    const status = await transaction.wait(10000)
    expect(status).toBe(TransactionStatusEnum.CONFIRMED)
    return transaction
}

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('Toncoin')
        expect(coin.getSymbol()).toBe('TON')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(9)
    })

    it('Balance', async () => {
        await waitForSec(1)
        const balance = await coin.getBalance(balanceTestAddress)
        expect(balance).toBe(coinBalanceTestAmount)
    })

    it('Transfer', async () => {
        await waitForSec(1)
        const signer = await coin.transfer(
            senderTestAddress,
            receiverTestAddress,
            transferTestAmount
        )

        await checkSigner(signer)

        if (!coinTransferTestIsActive) return

        await checkTx(await signer.send())
    })
})

describe('Token', () => {
    const token = new Token(tokenTestAddress)

    it('Name and symbol', async () => {
        await waitForSec(1)
        expect(await token.getName()).toBe('TON Test Token')
        expect(await token.getSymbol()).toBe('TTT')
    })

    it('Decimals', async () => {
        expect(await token.getDecimals()).toBe(9)
    })

    it('Balance', async () => {
        await waitForSec(1)
        const balance = await token.getBalance(balanceTestAddress)
        expect(balance).toBe(tokenBalanceTestAmount)
    })

    it('Total supply', async () => {
        await waitForSec(1)
        const totalSupply = await token.getTotalSupply()
        expect(totalSupply).toBe(100000000)
    })

    it('Transfer', async () => {
        await waitForSec(1)
        const signer = await token.transfer(
            senderTestAddress,
            receiverTestAddress,
            tokenTransferTestAmount
        )

        await checkSigner(signer)

        if (!tokenTransferTestIsActive) return

        await waitForSec(5)

        const beforeBalance = await token.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(math.add(beforeBalance, tokenTransferTestAmount))
    })

    // it('Approve and Allowance', async () => {
    //     const signer = await token.approve(
    //         senderTestAddress,
    //         receiverTestAddress,
    //         tokenApproveTestAmount
    //     )

    //     await checkSigner(signer)

    //     if (!tokenApproveTestIsActive) return

    //     await waitForSec(5)

    //     await checkTx(await signer.send())

    //     expect(await token.getAllowance(senderTestAddress, receiverTestAddress)).toBe(
    //         tokenApproveTestAmount
    //     )
    // })

    // it('Transfer from', async () => {
    //     const signer = await token.transferFrom(
    //         receiverTestAddress,
    //         senderTestAddress,
    //         receiverTestAddress,
    //         2
    //     )

    //     await checkSigner(signer, receiverPrivateKey)

    //     if (!tokenTransferFromTestIsActive) return

    //     await waitForSec(5)

    //     const beforeBalance = await token.getBalance(receiverTestAddress)

    //     await checkTx(await signer.send())

    //     const afterBalance = await token.getBalance(receiverTestAddress)
    //     expect(afterBalance).toBe(math.add(beforeBalance, 2))
    // })
})

describe('Nft', () => {
    const nft = new NFT(nftCollection)

    it('Name and symbol', async () => {
        await waitForSec(1)
        expect(await nft.getName()).toBe('NFT Test on TON')
        expect(await nft.getSymbol()).toBe('NFT Test on TON')
    })

    it('Balance', async () => {
        await waitForSec(1)
        const balance = await nft.getBalance(balanceTestAddress)
        expect(balance).toBe(nftBalanceTestAmount)
    })

    it('Owner', async () => {
        await waitForSec(1)
        expect(await nft.getOwner(nftBalanceId)).toBe(balanceTestAddress)
    })

    it('Token URI', async () => {
        await waitForSec(1)
        expect(await nft.getTokenURI(nftBalanceId)).toBe(
            'https://s.getgems.io/nft/c/677e3821c9af9379ef55f729/0/meta.json'
        )
    })

    // it('Approved', async () => {
    //     expect(await nft.getApproved(nftBalanceId)).toBe(null)
    // })

    it('Transfer', async () => {
        await waitForSec(1)
        const signer = await nft.transfer(senderTestAddress, receiverTestAddress, nftTransferId)

        await checkSigner(signer)

        if (!nftTransactionTestIsActive) return

        await waitForSec(5)

        await checkTx(await signer.send())

        expect(await nft.getOwner(nftTransferId)).toBe(receiverTestAddress)
    })

    // it('Approve', async () => {
    //     const customOwner = nftTransactionTestIsActive ? receiverTestAddress : senderTestAddress
    //     const customSpender = nftTransactionTestIsActive ? senderTestAddress : receiverTestAddress
    //     const customPrivateKey = nftTransactionTestIsActive ? receiverPrivateKey : senderPrivateKey

    //     const signer = await nft.approve(customOwner, customSpender, nftTransferId)

    //     await checkSigner(signer, customPrivateKey)

    //     if (!nftTransactionTestIsActive) return

    //     await waitForSec(5)

    //     await checkTx(await signer.send())

    //     expect(await nft.getApproved(nftTransferId)).toBe(senderTestAddress)
    // })

    // it('Transfer from', async () => {
    //     if (!nftTransactionTestIsActive) return

    //     await waitForSec(5)

    //     const signer = await nft.transferFrom(
    //         senderTestAddress,
    //         receiverTestAddress,
    //         senderTestAddress,
    //         nftTransferId
    //     )

    //     await checkSigner(signer)

    //     await checkTx(await signer.send())

    //     expect(await nft.getOwner(nftTransferId)).toBe(senderTestAddress)
    // })
})
