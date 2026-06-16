import { describe, it, expect } from 'vitest'

import './setup'
import { Transaction } from '../src/models/Transaction'
import { NftTransaction } from '../src/models/NftTransaction'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { TokenTransaction } from '../src/models/TokenTransaction'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'
import {
    mockBlockNumber,
    mockBlockTimestamp,
    nftObjectId,
    nftTransferTx,
    senderTestAddress as sender,
    receiverTestAddress as receiver,
    suiTransferTx,
    tokenAmount,
    coinAmount,
    tokenTestAddress as tokenType,
    nftTestAddress as nftType,
    tokenTransferTx
} from './fixtures'

describe('Transaction', () => {
    const tx = new Transaction(suiTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(suiTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('Wait', async () => {
        expect(await tx.wait()).toBe(TransactionStatusEnum.CONFIRMED)
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe(`https://suiscan.xyz/testnet/tx/${suiTransferTx}`)
    })

    it('Sender', async () => {
        expect(await tx.getSigner()).toBe(sender)
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.00199788)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(mockBlockNumber)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(mockBlockTimestamp)
    })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(397)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Coin Transaction', () => {
    const tx = new CoinTransaction(suiTransferTx)

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

describe('Token Transaction', () => {
    const tx = new TokenTransaction(tokenTransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Amount', async () => {
        expect(await tx.getAmount()).toBe(tokenAmount)
    })

    it('Address', async () => {
        expect(await tx.getAddress()).toBe(tokenType)
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
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Address', async () => {
        const address = await tx.getAddress()
        expect(address).toBe(address ? nftType : '')
    })

    it('Signer', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('NFT ID', async () => {
        expect(await tx.getNftId()).toBe(nftObjectId)
    })

    it('Verify Transfer', async () => {
        expect(await tx.verifyTransfer(AssetDirectionEnum.INCOMING, receiver, nftObjectId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, sender, nftObjectId)).toBe(
            TransactionStatusEnum.CONFIRMED
        )

        expect(await tx.verifyTransfer(AssetDirectionEnum.OUTGOING, receiver, nftObjectId)).toBe(
            TransactionStatusEnum.FAILED
        )
    })
})
