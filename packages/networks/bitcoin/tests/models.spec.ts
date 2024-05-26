import { describe, it, expect } from 'vitest'
import { Transaction } from '../src/models/Transaction'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'

const testAmount = Number(process.env.BTC_TRANSFER_AMOUNT)
const senderTestAddress = String(process.env.BTC_SENDER_ADDRESS)
const receiverTestAddress = String(process.env.BTC_RECEIVER_ADDRESS)
const txId = '335c8a251e5f18121977c3159f46983d5943325abccc19e4718c49089553d60c'

describe('Transaction', () => {
    const tx = new Transaction(txId)
    it('Id', async () => {
        expect(tx.getId()).toBe(txId)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe('https://blockstream.info/testnet/tx/' + txId)
    })

    it('Sender', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(senderTestAddress.toLowerCase())
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.00014)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(2814543)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(1715328679)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(13)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(txId)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiverTestAddress.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(testAmount)
    })

    it('Verify Transfer', async () => {
        expect(
            await tx.verifyTransfer(AssetDirectionEnum.INCOMING, receiverTestAddress, testAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(
            await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, senderTestAddress, testAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(
            await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, receiverTestAddress, testAmount)
        ).toBe(TransactionStatusEnum.FAILED)
    })
})
