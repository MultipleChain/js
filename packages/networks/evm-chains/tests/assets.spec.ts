import { describe, it, expect, assert } from 'vitest'

import { NFT } from '../src/assets/NFT.ts'
import { Coin } from '../src/assets/Coin.ts'
import { Token } from '../src/assets/Token.ts'
import { fixFloat } from '@multiplechain/utils'
import { Transaction } from '../src/models/Transaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import { TransactionSigner } from '../src/services/TransactionSigner.ts'

const coinTransferTestIsActive = false
const tokenTransferTestIsActive = false
const tokenApproveTestIsActive = false
const tokenTransferFromTestIsActive = false
const nftTransactionTestIsActive = false

const balanceTestAddress = '0x760A4d3D03928D1e8541A7644B34370c1b79aa9F'
const coinBalanceTestAmount = 0.01
const tokenBalanceTestAmount = 1000
const nftBalanceTestAmount = 2

const senderPrivateKey = '0x14bd9af4e87981b37b7b2e8a0d1d249b7fcdb7a3bc579c4c31488842d372c0e9'
const receiverPrivateKey = '0x22ac1009c43f251e0b5a808751990abe77a74fe12f390c0cc95ab179a0b61a5a'
const senderTestAddress = '0x110600bF0399174520a159ed425f0D272Ff8b459'
const receiverTestAddress = '0xbBa4d06D1cEf94b35aDeCfDa893523907fdD36DE'
const tokenTestAddress = '0x4294cb0dD25dC9140B5127f247cBd47Eeb673431'
const nftTestAddress = '0x06B8B36e4feD2206E980445C0f0829fc6B2aA91F'
const transferTestAmount = 0.0001
const tokenTransferTestAmount = 1
const tokenApproveTestAmount = 100
const nftTransferId = 7

const waitSecondsBeforeThanNewTx = async (seconds: number): Promise<any> => {
    return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const checkSigner = async (signer: TransactionSigner, privateKey?: string): Promise<any> => {
    expect(signer).toBeInstanceOf(TransactionSigner)

    const rawData = signer.getRawData()

    assert.isObject(rawData)

    await signer.sign(privateKey ?? senderPrivateKey)

    assert.isString(signer.getSignedData())
}

const checkTx = async (transaction: Transaction): Promise<any> => {
    expect(transaction).toBeInstanceOf(Transaction)
    const status = await transaction.wait(10)
    expect(status).toBe(TransactionStatusEnum.CONFIRMED)
}

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('Ethereum')
        expect(coin.getSymbol()).toBe('ETH')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(18)
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
        expect(afterBalance).toBe(fixFloat(beforeBalance + transferTestAmount))
    })
})

describe('Token', () => {
    const token = new Token(tokenTestAddress)

    it('Name and symbol', async () => {
        expect(await token.getName()).toBe('MyToken')
        expect(await token.getSymbol()).toBe('MTK')
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
        if (!tokenTransferTestIsActive) return

        await waitSecondsBeforeThanNewTx(30)

        const signer = await token.transfer(
            senderTestAddress,
            receiverTestAddress,
            tokenTransferTestAmount
        )

        await checkSigner(signer)

        const beforeBalance = await token.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(fixFloat(beforeBalance + tokenTransferTestAmount))
    })

    it('Approve and Allowance', async () => {
        if (!tokenApproveTestIsActive) return

        await waitSecondsBeforeThanNewTx(30)

        const signer = await token.approve(
            senderTestAddress,
            receiverTestAddress,
            tokenApproveTestAmount
        )

        await checkSigner(signer)

        await checkTx(await signer.send())

        expect(await token.getAllowance(senderTestAddress, receiverTestAddress)).toBe(
            tokenApproveTestAmount
        )
    })

    it('Transfer from', async () => {
        if (!tokenTransferFromTestIsActive) return

        await waitSecondsBeforeThanNewTx(30)

        const signer = await token.transferFrom(
            receiverTestAddress,
            senderTestAddress,
            receiverTestAddress,
            2
        )

        await checkSigner(signer, receiverPrivateKey)

        const beforeBalance = await token.getBalance(receiverTestAddress)

        await checkTx(await signer.send())

        const afterBalance = await token.getBalance(receiverTestAddress)
        expect(afterBalance).toBe(fixFloat(beforeBalance + 2))
    })
})

describe('Nft', () => {
    const nft = new NFT(nftTestAddress)

    it('Name and symbol', async () => {
        expect(await nft.getName()).toBe('TestNFT')
        expect(await nft.getSymbol()).toBe('TNFT')
    })

    it('Balance', async () => {
        const balance = await nft.getBalance(balanceTestAddress)
        expect(balance).toBe(nftBalanceTestAmount)
    })

    it('Owner', async () => {
        expect(await nft.getOwner(5)).toBe(balanceTestAddress)
    })

    it('Token URI', async () => {
        expect(await nft.getTokenURI(5)).toBe('')
    })

    it('Approved', async () => {
        expect(await nft.getApproved(5)).toBe('0x0000000000000000000000000000000000000000')
    })

    it('Transfer', async () => {
        if (!nftTransactionTestIsActive) return

        await waitSecondsBeforeThanNewTx(30)

        const signer = await nft.transfer(senderTestAddress, receiverTestAddress, nftTransferId)

        await checkSigner(signer)

        await checkTx(await signer.send())

        expect(await nft.getOwner(nftTransferId)).toBe(receiverTestAddress)
    })

    it('Approve', async () => {
        if (!nftTransactionTestIsActive) return

        await waitSecondsBeforeThanNewTx(30)

        const signer = await nft.approve(receiverTestAddress, senderTestAddress, nftTransferId)

        await checkSigner(signer, receiverPrivateKey)

        await checkTx(await signer.send())

        expect(await nft.getApproved(nftTransferId)).toBe(senderTestAddress)
    })

    it('Transfer from', async () => {
        if (!nftTransactionTestIsActive) return

        await waitSecondsBeforeThanNewTx(30)

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
