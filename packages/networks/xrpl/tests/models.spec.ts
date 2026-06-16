import { describe, it, expect } from 'vitest'

import './setup'
import { Transaction } from '../src/models/Transaction'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'
import {
    coinAmount,
    mockBlockNumber,
    mockBlockTimestamp,
    modelFee,
    receiverTestAddress,
    senderTestAddress,
    xrpTransferTx
} from './fixtures'

describe('Transaction', () => {
    const tx = new Transaction(xrpTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(xrpTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe('https://testnet.xrpl.org/transactions/' + xrpTransferTx)
    })

    it('Sender', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(senderTestAddress.toLowerCase())
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(modelFee)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(mockBlockNumber)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(mockBlockTimestamp)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(13)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(xrpTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiverTestAddress.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(coinAmount)
    })

    it('Verify Transfer', async () => {
        expect(
            await tx.verifyTransfer(AssetDirectionEnum.INCOMING, receiverTestAddress, coinAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(
            await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, senderTestAddress, coinAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(
            await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, receiverTestAddress, coinAmount)
        ).toBe(TransactionStatusEnum.FAILED)
    })
})
