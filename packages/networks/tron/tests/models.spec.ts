import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction'
import { NftTransaction } from '../src/models/NftTransaction'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { TokenTransaction } from '../src/models/TokenTransaction'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'

const nftId = Number(process.env.TRON_NFT_ID)
const tokenAmount = Number(process.env.TRON_TOKEN_AMOUNT)
const coinAmount = Number(process.env.TRON_COIN_AMOUNT)

const trxTransferTx = String(process.env.TRON_TRX_TRANSFER_TX)
const tokenTransferTx = String(process.env.TRON_TOKEN_TRANSFER_TX)
const nftTransferTx = String(process.env.TRON_NFT_TRANSFER_TX)

const testSender = String(process.env.TRON_MODEL_TEST_SENDER)
const testReceiver = String(process.env.TRON_MODEL_TEST_RECEIVER)

describe('Transaction', () => {
    const tx = new Transaction(trxTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(trxTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe(
            'https://nile.tronscan.org/#/transaction/8697ad2c4e1713227c16a65a5845636458df2d3db3adf526e07e17699bc6b3c4'
        )
    })

    it('Sender', async () => {
        expect(await tx.getSigner()).toBe(testSender)
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(1.1)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(46506377)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(1714619148)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(199)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(trxTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(testReceiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(coinAmount)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, testReceiver, coinAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, testSender, coinAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, testReceiver, coinAmount)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})

describe('Token Transaction', () => {
    const tx = new TokenTransaction(tokenTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(testReceiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(tokenAmount)
    })

    it('Verify Transfer', async () => {
        expect(
            await tx.verifyTransfer(AssetDirectionEnum.INCOMING, testReceiver, tokenAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, testSender, tokenAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(
            await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, testReceiver, tokenAmount)
        ).toBe(TransactionStatusEnum.FAILED)
    })
})

describe('NFT Transaction', () => {
    const tx = new NftTransaction(nftTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(testReceiver.toLowerCase())
    })

    it('Signer', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(testSender.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(testSender.toLowerCase())
    })

    it('NFT ID', async () => {
        expect(await tx.getNftId()).toBe(nftId)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, testReceiver, nftId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, testSender, nftId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, testReceiver, nftId)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})
