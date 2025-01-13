import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction'
import { NftTransaction } from '../src/models/NftTransaction'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { TokenTransaction } from '../src/models/TokenTransaction'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'

const nftId = String(process.env.TON_NFT_ID)
const tokenAmount = Number(process.env.TON_TOKEN_AMOUNT)
const coinAmount = Number(process.env.TON_COIN_AMOUNT)
const nftCollection = String(process.env.TON_NFT_COLLECTION)

const tonTransferTx = String(process.env.TON_TRANSFER_TX)
const tokenTransferTx = String(process.env.TON_TOKEN_TRANSFER_TX)
const nftTransferTx = String(process.env.TON_NFT_TRANSFER_TX)

const sender = String(process.env.TON_SENDER_ADDRESS)
const receiver = String(process.env.TON_RECEIVER_ADDRESS)

const waitForSec = async (seconds: number): Promise<any> => {
    return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

describe('Transaction', () => {
    const tx = new Transaction(tonTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(tonTransferTx)
    })

    it('Data', async () => {
        await waitForSec(1)
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe(
            'https://testnet.tonscan.org/tx/6f97ca02d8f20151210ca2bef32340804214e4f74eebf6a9edf13b727ac2527e'
        )
    })

    it('Sender', async () => {
        expect(await tx.getSigner()).toBe(sender)
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.002830538)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(28607062)
    })

    it('Block ID', async () => {
        expect(await tx.getBlockId()).toBe('0:6000000000000000:28607062')
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(1736323418)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(77696)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(tonTransferTx)

    it('Receiver', async () => {
        await waitForSec(1)
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

describe('Token Transaction', () => {
    const tx = new TokenTransaction(tokenTransferTx)

    it('Receiver', async () => {
        await waitForSec(1)
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(tokenAmount)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, receiver, tokenAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, sender, tokenAmount)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, receiver, tokenAmount)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})

describe('NFT Transaction', () => {
    const tx = new NftTransaction(nftTransferTx)

    it('Receiver', async () => {
        await waitForSec(1)
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Address', async () => {
        expect((await tx.getAddress()).toLowerCase()).toBe(nftCollection.toLowerCase())
    })

    it('Signer', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('NFT ID', async () => {
        expect(await tx.getNftId()).toBe(nftId)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, receiver, nftId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, sender, nftId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, receiver, nftId)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})
