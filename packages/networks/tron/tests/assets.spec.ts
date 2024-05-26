import { describe, it, expect, assert } from 'vitest'

import { NFT } from '../src/assets/NFT'
import { Coin } from '../src/assets/Coin'
import { math } from '@multiplechain/utils'
import { Token } from '../src/assets/Token'
import { Transaction } from '../src/models/Transaction'
import { TransactionStatusEnum, type TransactionId } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner'

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

const waitSecondsBeforeThanNewTx = async (seconds: number): Promise<any> => {
    return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey)

    assert.isObject(signer.getSignedData())
}

const checkTx = async (TransactionId: TransactionId): Promise<any> => {
    const transaction = new Transaction(TransactionId)
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

describe('Token', () => {
    const token = new Token(tokenTestAddress)

    it('Name and symbol', async () => {
        expect(await token.getName()).toBe('SampleToken')
        expect(await token.getSymbol()).toBe('SMP')
    })

    it('Decimals', async () => {
        expect(await token.getDecimals()).toBe(18)
    })

    it('Balance', async () => {
        const balance = await token.getBalance(balanceTestAddress)
        expect(balance).toBe(tokenBalanceTestAmount)
    })

    it('Total supply', async () => {
        const totalSupply = await token.getTotalSupply()
        expect(totalSupply).toBe(1000000)
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
})

describe('Nft', () => {
    const nft = new NFT(nftTestAddress)

    it('Name and symbol', async () => {
        expect(await nft.getName()).toBe('MyNFT')
        expect(await nft.getSymbol()).toBe('MNFT')
    })

    it('Balance', async () => {
        const balance = await nft.getBalance(balanceTestAddress)
        expect(balance).toBe(nftBalanceTestAmount)
    })

    it('Owner', async () => {
        expect(await nft.getOwner(5)).toBe(senderTestAddress)
    })

    it('Token URI', async () => {
        expect(await nft.getTokenURI(5)).toBe('')
    })

    it('Approved', async () => {
        expect(await nft.getApproved(5)).toBe(null)
    })

    it('Transfer', async () => {
        const signer = await nft.transfer(senderTestAddress, receiverTestAddress, nftTransferId)

        await checkSigner(signer)

        if (!nftTransactionTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        await checkTx(await signer.send())

        expect(await nft.getOwner(nftTransferId)).toBe(receiverTestAddress)
    })

    it('Approve', async () => {
        const customOwner = nftTransactionTestIsActive ? receiverTestAddress : senderTestAddress
        const customSpender = nftTransactionTestIsActive ? senderTestAddress : receiverTestAddress
        const customPrivateKey = nftTransactionTestIsActive ? receiverPrivateKey : senderPrivateKey

        const signer = await nft.approve(customOwner, customSpender, nftTransferId)

        await checkSigner(signer, customPrivateKey)

        if (!nftTransactionTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        await checkTx(await signer.send())

        expect(await nft.getApproved(nftTransferId)).toBe(senderTestAddress)
    })

    it('Transfer from', async () => {
        if (!nftTransactionTestIsActive) return

        await waitSecondsBeforeThanNewTx(5)

        const signer = await nft.transferFrom(
            senderTestAddress,
            receiverTestAddress,
            senderTestAddress,
            nftTransferId
        )

        await checkSigner(signer)

        await checkTx(await signer.send())

        expect(await nft.getOwner(nftTransferId)).toBe(senderTestAddress)
    })
})
