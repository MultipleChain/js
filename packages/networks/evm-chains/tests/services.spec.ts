import { describe, it, expect } from 'vitest'

import { provider } from './setup.ts'
import { Provider } from '../src/services/Provider.ts'
import { TransactionListener } from '../src/services/TransactionListener.ts'
import { TransactionTypeEnum } from '@multiplechain/types'
import { Coin } from '../src/assets/Coin.ts'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { ContractTransaction } from '../src/models/ContractTransaction.ts'
import { Token } from '../src/assets/Token.ts'
import { Transaction } from '../src/models/Transaction.ts'
import { TokenTransaction } from '../src/models/TokenTransaction.ts'
import { NftTransaction } from '../src/models/NftTransaction.ts'
import { NFT } from '../src/assets/NFT.ts'

const senderPrivateKey = String(process.env.EVM_SENDER_PRIVATE_KEY)
const receiverPrivateKey = String(process.env.EVM_RECEIVER_PRIVATE_KEY)
const senderTestAddress = String(process.env.EVM_SENDER_TEST_ADDRESS)
const receiverTestAddress = String(process.env.EVM_RECEIVER_TEST_ADDRESS)
const tokenTestAddress = String(process.env.EVM_TOKEN_TEST_ADDRESS)
const nftTestAddress = String(process.env.EVM_NFT_TEST_ADDRESS)

const transactionListenerTestIsActive = Boolean(
    process.env.EVM_TRANSACTION_LISTENER_TEST_IS_ACTIVE !== 'false'
)

const waitSecondsBeforeThanNewTx = async (seconds: number): Promise<any> => {
    return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

describe('Provider', () => {
    it('isTestnet', () => {
        expect(provider.isTestnet()).toBe(true)
    })

    it('instance', () => {
        expect(Provider.instance).toBe(provider)
    })

    it('checkRpcConnection', async () => {
        expect(await provider.checkRpcConnection('https://sepolia.infura.io/v3')).instanceOf(Error)
        expect(
            await provider.checkRpcConnection(process.env.EVM_RPC_URL as unknown as string)
        ).toBe(true)
    })

    it('checkWsConnection', async () => {
        expect(await provider.checkWsConnection('wss://sepolia.infura.io/v3')).instanceOf(Error)
        expect(await provider.checkWsConnection(process.env.EVM_WS_URL as unknown as string)).toBe(
            true
        )
    })
})

describe('Transaction Listener', () => {
    if (!transactionListenerTestIsActive) {
        it('No test is active', () => {
            expect(true).toBe(true)
        })
        return
    }

    it('General', async () => {
        const listener = new TransactionListener(TransactionTypeEnum.GENERAL, {
            signer: senderTestAddress
        })

        void listener.on((transaction) => {
            listener.stop()
            expect(transaction).toBeInstanceOf(Transaction)
        })

        const signer = await new Coin().transfer(senderTestAddress, receiverTestAddress, 0.0001)

        const transaction = await (await signer.sign(senderPrivateKey)).send()

        expect(transaction).toBeInstanceOf(Transaction)

        void (await transaction.wait())
    })

    it('Contract', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.CONTRACT, {
            signer: senderTestAddress,
            address: tokenTestAddress
        })

        void listener.on((transaction) => {
            listener.stop()
            expect(transaction).toBeInstanceOf(ContractTransaction)
        })

        const signer = await new Token(tokenTestAddress).transfer(
            senderTestAddress,
            receiverTestAddress,
            0.01
        )

        const transaction = await (await signer.sign(senderPrivateKey)).send()

        expect(transaction).toBeInstanceOf(ContractTransaction)

        void (await transaction.wait())
    })

    it('Coin', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.COIN, {
            signer: senderTestAddress,
            receiver: receiverTestAddress
        })

        void listener.on((transaction) => {
            listener.stop()
            expect(transaction).toBeInstanceOf(CoinTransaction)
        })

        const signer = await new Coin().transfer(senderTestAddress, receiverTestAddress, 0.0001)

        const transaction = await (await signer.sign(senderPrivateKey)).send()

        expect(transaction).toBeInstanceOf(CoinTransaction)

        void (await transaction.wait())
    })

    it('Token', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.TOKEN, {
            signer: senderTestAddress,
            receiver: receiverTestAddress,
            address: tokenTestAddress
        })

        void listener.on((transaction) => {
            listener.stop()
            expect(transaction).toBeInstanceOf(TokenTransaction)
        })

        const signer = await new Token(tokenTestAddress).transfer(
            senderTestAddress,
            receiverTestAddress,
            0.01
        )

        const transaction = await (await signer.sign(senderPrivateKey)).send()

        expect(transaction).toBeInstanceOf(TokenTransaction)

        void (await transaction.wait())
    })

    it('NFT', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.NFT, {
            signer: senderTestAddress,
            receiver: receiverTestAddress,
            address: nftTestAddress
        })

        void listener.on((transaction) => {
            listener.stop()
            expect(transaction).toBeInstanceOf(NftTransaction)
        })

        const nft = new NFT(nftTestAddress)
        const signer = await nft.transfer(senderTestAddress, receiverTestAddress, 9)

        const transaction = await (await signer.sign(senderPrivateKey)).send()

        expect(transaction).toBeInstanceOf(NftTransaction)

        void (await transaction.wait())

        await waitSecondsBeforeThanNewTx(10)

        const newSigner = await nft.transfer(receiverTestAddress, senderTestAddress, 9)

        const newTransaction = await (await newSigner.sign(receiverPrivateKey)).send()

        expect(newTransaction).toBeInstanceOf(NftTransaction)
    })
})
