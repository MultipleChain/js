import { describe, it, expect } from 'vitest'

import { Transaction } from '../src/models/Transaction.ts'
import { NftTransaction } from '../src/models/NftTransaction.ts'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { TokenTransaction } from '../src/models/TokenTransaction.ts'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'
import { ContractTransaction } from '../src/models/ContractTransaction.ts'

const nftId = String(process.env.SOL_NFT_ID)
const tokenAmount = Number(process.env.SOL_TOKEN_AMOUNT)
const coinAmount = Number(process.env.SOL_COIN_AMOUNT)

const solTransferTx = String(process.env.SOL_TRANSFER_TX)
const tokenTransferTx = String(process.env.SOL_TOKEN_TRANSFER_TX)
const token2022TransferTx = String(process.env.SOL_TOKEN_2022_TRANSFER_TX)
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

describe('Contract Transaction', () => {
    const tx = new ContractTransaction(
        '5pak57tjpTf4BfHweZryxtmJBWsJjeaU56N6CbuwuSuNyPtHwKsu6CZp6Y2L9dHqNJH33w6V895ZQLgRjANJJSR3'
    )

    it('Address', async () => {
        expect((await tx.getAddress()).toLowerCase()).toBe(
            'HeXZiyduAmAaYABvrh4bU94TdzB2TkwFuNXfgi1PYFwS'.toLowerCase()
        )
    })
})

describe('Token Transaction', () => {
    const tx = new TokenTransaction(tokenTransferTx)
    const tx2022 = new TokenTransaction(token2022TransferTx)

    it('Receiver', async () => {
        expect((await tx.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('Program', async () => {
        expect((await tx.getAddress()).toLowerCase()).toBe(
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'.toLowerCase()
        )
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

    it('Receiver', async () => {
        expect((await tx2022.getReceiver()).toLowerCase()).toBe(receiver.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx2022.getSender()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('Program', async () => {
        expect((await tx2022.getAddress()).toLowerCase()).toBe(
            'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'.toLowerCase()
        )
    })

    it('Amount', async () => {
        expect(await tx2022.getAmount()).toBe(tokenAmount)
    })

    it('Verify Transfer', async () => {
        expect(
            await tx2022.verifyTransfer(AssetDirectionEnum.INCOMING, receiver, tokenAmount)
        ).toBe(TransactionStatusEnum.CONFIRMED)

        expect(await tx2022.verifyTransfer(AssetDirectionEnum.OUTGOING, sender, tokenAmount)).toBe(
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

    it('Signer', async () => {
        expect((await tx.getSigner()).toLowerCase()).toBe(sender.toLowerCase())
    })

    it('Program', async () => {
        expect((await tx.getAddress()).toLowerCase()).toBe(
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'.toLowerCase()
        )
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
