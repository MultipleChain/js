import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction.ts'
import { NftTransaction } from '../src/models/NftTransaction.ts'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { TokenTransaction } from '../src/models/TokenTransaction.ts'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'

const nftId = Number(process.env.BLP_NFT_ID)
const tokenAmount = Number(process.env.BLP_TOKEN_AMOUNT)
const coinAmount = Number(process.env.BLP_COIN_AMOUNT)

const etherTransferTx = String(process.env.BLP_ETHER_TRANSFER_TX)
const tokenTransferTx = String(process.env.BLP_TOKEN_TRANSFER_TX)
const nftTransferTx = String(process.env.BLP_NFT_TRANSFER_TX)

const coinSender = String(process.env.BLP_COIN_SENDER)
const coinReceiver = String(process.env.BLP_COIN_RECEIVER)

const tokenSender = String(process.env.BLP_TOKEN_SENDER)
const tokenReceiver = String(process.env.BLP_TOKEN_RECEIVER)

const nftSender = String(process.env.BLP_NFT_SENDER)
const nftReceiver = String(process.env.BLP_NFT_RECEIVER)

describe('Transaction', () => {
    const tx = new Transaction(etherTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(etherTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe('boilerplate url')
    })

    it('Sender', async () => {
        expect(await tx.getSigner()).toBe(coinSender)
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.000371822357865)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(5461884)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(1710141144)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(129954)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(etherTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(coinReceiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(coinAmount)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, coinReceiver, coinAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, coinSender, coinAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, coinReceiver, coinAmount)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})

describe('Token Transaction', () => {
    const tx = new TokenTransaction(tokenTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(tokenReceiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(tokenAmount)
    })

    it('Verify Transfer', async () => {
        expect(
            await tx.verifyTransfer(AssetDirectionEnum.INCOMING, tokenReceiver, tokenAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, tokenSender, tokenAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(
            await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, tokenReceiver, tokenAmount)
        ).toBe(TransactionStatusEnum.FAILED)
    })
})

describe('NFT Transaction', () => {
    const tx = new NftTransaction(nftTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(nftReceiver.toLowerCase())
    })

    it('Signer', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(nftReceiver.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(nftSender.toLowerCase())
    })

    it('NFT ID', async () => {
        expect(await tx.getNftId()).toBe(nftId)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, nftReceiver, nftId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, nftSender, nftId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, nftReceiver, nftId)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})
