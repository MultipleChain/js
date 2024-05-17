import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction.ts'
import { NftTransaction } from '../src/models/NftTransaction.ts'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { TokenTransaction } from '../src/models/TokenTransaction.ts'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'

const nftId = String(process.env.SOL_NFT_ID)
const tokenAmount = Number(process.env.SOL_TOKEN_AMOUNT)
const coinAmount = Number(process.env.SOL_COIN_AMOUNT)

const solTransferTx = String(process.env.SOL_TRANSFER_TX)
const tokenTransferTx = String(process.env.SOL_TOKEN_TRANSFER_TX)
const nftTransferTx = String(process.env.SOL_NFT_TRANSFER_TX)

const sender = String(process.env.SOL_MODEL_TEST_SENDER)
const receiver = String(process.env.SOL_MODEL_TEST_RECEIVER)

describe('Transaction', () => {
    const tx = new Transaction(solTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(solTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe(
            'https://solscan.io/tx/2RDU1otuPR6UtevwYCQWnngvvjPiTFuHFdyCnzwQVR8wyZ7niqACt2QBmfuyD5aXJbEXSEUcqFquiCEtcQZzkWif?cluster=devnet'
        )
    })

    it('Sender', async () => {
        expect(await tx.getSigner()).toBe(sender)
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.000065)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(299257452)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(1715865360)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(4567)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(solTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(coinAmount)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, receiver, coinAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, sender, coinAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, receiver, coinAmount)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})
