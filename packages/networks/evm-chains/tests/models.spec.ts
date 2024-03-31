import { describe, it, expect } from 'vitest'

import ERC20 from '../resources/erc20.json'
import { Transaction } from '../src/models/Transaction.ts'
import { AssetDirectionEnum, TransactionStatusEnum } from '@multiplechain/types'
import { ContractTransaction } from '../src/models/ContractTransaction.ts'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { TokenTransaction } from '../src/models/TokenTransaction.ts'
import { NftTransaction } from '../src/models/NftTransaction.ts'

const etherTransferTx = '0x566002399664e92f82ed654c181095bdd7ff3d3f1921d963257585891f622251'
const tokenTransferTx = '0xdabda3905e585db91768f2ef877f7fbef7c0e8612c0a09c7b379981bdbc48975'
const nftTransferTx = '0x272a4698cd2062f2463481cf9eb78b68b35d59938383679b7642e6d669ac87eb'

const nftId = 7
const tokenAmount = 1
const coinAmount = 0.002548

const coinSender = '0x74dBE9cA4F93087A27f23164d4367b8ce66C33e2'
const coinReceiver = '0xb3C86232c163A988Ce4358B10A2745864Bfaa3Ba'

const tokenSender = '0x110600bF0399174520a159ed425f0D272Ff8b459'
const tokenReceiver = '0xbBa4d06D1cEf94b35aDeCfDa893523907fdD36DE'

const nftSender = '0xbBa4d06D1cEf94b35aDeCfDa893523907fdD36DE'
const nftReceiver = '0x110600bF0399174520a159ed425f0D272Ff8b459'

describe('Transaction', () => {
    const tx = new Transaction(etherTransferTx)
    it('Id', async () => {
        expect(tx.getId()).toBe(etherTransferTx)
    })

    it('Data', async () => {
        expect(await tx.getData()).toBeTypeOf('object')
    })

    it('URL', async () => {
        expect(tx.getUrl()).toBe(
            'https://sepolia.etherscan.io/tx/0x566002399664e92f82ed654c181095bdd7ff3d3f1921d963257585891f622251'
        )
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

    // Not give any response in vitest environment
    // it('Block Timestamp', async () => {
    //     expect(await tx.getBlockTimestamp()).toBe(1710141144)
    // })

    it('Block Confirmation Count', async () => {
        expect(await tx.getBlockConfirmationCount()).toBeGreaterThan(129954)
    })

    it('Status', async () => {
        expect(await tx.getStatus()).toBe(TransactionStatusEnum.CONFIRMED)
    })
})

describe('Contract Transaction', () => {
    const tx = new ContractTransaction(tokenTransferTx)

    it('Address', async () => {
        expect((await tx.getAddress()).toLowerCase()).toBe(
            '0x4294cb0dD25dC9140B5127f247cBd47Eeb673431'.toLowerCase()
        )
    })

    it('Decode Data', async () => {
        const result = await tx.decodeData(ERC20)
        expect(result?.args[0]).toBe('0xbBa4d06D1cEf94b35aDeCfDa893523907fdD36DE')
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

    it('From', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(nftSender.toLowerCase())
    })

    it('Sender', async () => {
        expect((await tx.getSender()).toLowerCase()).toBe(nftReceiver.toLowerCase())
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
