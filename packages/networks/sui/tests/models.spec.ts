import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction'
import { NftTransaction } from '../src/models/NftTransaction'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { TokenTransaction } from '../src/models/TokenTransaction'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'

const nftObjectId = String(process.env.SUI_MODEL_NFT_OBJECT_ID)
const tokenAmount = Number(process.env.SUI_MODEL_TOKEN_AMOUNT)
const coinAmount = Number(process.env.SUI_MODEL_COIN_AMOUNT)

const tokenType = String(process.env.SUI_TOKEN_TYPE_ADDRESS)
const nftType = String(process.env.SUI_NFT_TYPE_ADDRESS)

const suiTransferTx = String(process.env.SUI_TRANSFER_TX)
const tokenTransferTx = String(process.env.SUI_TOKEN_TRANSFER_TX)
const nftTransferTx = String(process.env.SUI_NFT_TRANSFER_TX)

const sender = String(process.env.SUI_MODEL_TEST_SENDER)
const receiver = String(process.env.SUI_MODEL_TEST_RECEIVER)

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
        expect(tx.getUrl()).toBe(
            'https://suiscan.xyz/testnet/tx/38rQ6ThScL69gSLaWez9i8kj3CEw6eyqjkCoNPbcxPKN'
        )
    })

    it('Sender', async () => {
        expect(await tx.getSigner()).toBe(sender)
    })

    it('Fee', async () => {
        expect(await tx.getFee()).toBe(0.00199788)
    })

    it('Block Number', async () => {
        expect(await tx.getBlockNumber()).toBe(205822572)
    })

    it('Block Timestamp', async () => {
        expect(await tx.getBlockTimestamp()).toBe(1749451910786)
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
        expect(await tx.getAddress()).toBe(nftType)
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
