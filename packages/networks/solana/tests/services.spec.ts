import { describe, it, expect } from 'vitest'

import { provider } from './setup.ts'
import { Provider } from '../src/services/Provider.ts'

import { NFT } from '../src/assets/NFT.ts'
import { Coin } from '../src/assets/Coin.ts'
import { Token } from '../src/assets/Token.ts'
import { sleep } from '@multiplechain/utils'
import { TransactionTypeEnum } from '@multiplechain/types'
import { Transaction } from '../src/models/Transaction.ts'
import { NftTransaction } from '../src/models/NftTransaction.ts'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { TokenTransaction } from '../src/models/TokenTransaction.ts'
import { ContractTransaction } from '../src/models/ContractTransaction.ts'
import { TransactionListener } from '../src/services/TransactionListener.ts'

const senderPrivateKey = String(process.env.SOL_SENDER_PRIVATE_KEY)
const receiverPrivateKey = String(process.env.SOL_RECEIVER_PRIVATE_KEY)
const senderTestAddress = String(process.env.SOL_SENDER_TEST_ADDRESS)
const receiverTestAddress = String(process.env.SOL_RECEIVER_TEST_ADDRESS)
const tokenTestAddress = String(process.env.SOL_TOKEN_TEST_ADDRESS)
const tokenProgram = String(process.env.SOL_TOKEN_PROGRAM)
const nftTestAddress = String(process.env.SOL_NFT_TEST_ADDRESS)
const nftTestAddress2 = String(process.env.SOL_NFT_TRANSFER_ID2)

const transactionListenerTestIsActive = Boolean(
    process.env.SOL_TRANSACTION_LISTENER_TEST_IS_ACTIVE !== 'false'
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
        expect(await provider.checkRpcConnection()).toBe(true)
    })

    it('checkWsConnection', async () => {
        expect(await provider.checkWsConnection()).toBe(true)
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

        const signer = await new Coin().transfer(senderTestAddress, receiverTestAddress, 0.0001)

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await sleep(2000)
                        void (await signer.sign(senderPrivateKey)).send()
                    })
                    .catch(reject)
            })
        }

        expect(await waitListenerEvent()).toBeInstanceOf(Transaction)
    })

    it('Contract', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.CONTRACT, {
            signer: senderTestAddress,
            address: tokenProgram
        })

        const signer = await new Token(tokenTestAddress).transfer(
            senderTestAddress,
            receiverTestAddress,
            0.01
        )

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await sleep(2000)
                        void (await signer.sign(senderPrivateKey)).send()
                    })
                    .catch(reject)
            })
        }

        expect(await waitListenerEvent()).toBeInstanceOf(ContractTransaction)
    })

    it('Coin', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.COIN, {
            signer: senderTestAddress,
            receiver: receiverTestAddress
        })

        const signer = await new Coin().transfer(senderTestAddress, receiverTestAddress, 0.0001)

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await sleep(2000)
                        void (await signer.sign(senderPrivateKey)).send()
                    })
                    .catch(reject)
            })
        }

        expect(await waitListenerEvent()).toBeInstanceOf(CoinTransaction)
    })

    it('Token', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.TOKEN, {
            signer: senderTestAddress,
            receiver: receiverTestAddress,
            address: tokenTestAddress
        })

        const signer = await new Token(tokenTestAddress).transfer(
            senderTestAddress,
            receiverTestAddress,
            0.01
        )

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await sleep(2000)
                        void (await signer.sign(senderPrivateKey)).send()
                    })
                    .catch(reject)
            })
        }

        expect(await waitListenerEvent()).toBeInstanceOf(TokenTransaction)
    })

    it('NFT', async () => {
        await waitSecondsBeforeThanNewTx(10)

        const listener = new TransactionListener(TransactionTypeEnum.NFT, {
            signer: senderTestAddress,
            receiver: receiverTestAddress,
            address: nftTestAddress2
        })

        const nft = new NFT(nftTestAddress)
        const signer = await nft.transfer(senderTestAddress, receiverTestAddress, nftTestAddress2)

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await sleep(2000)
                        void (await signer.sign(senderPrivateKey)).send()
                    })
                    .catch(reject)
            })
        }

        const transaction = await waitListenerEvent()
        expect(transaction).toBeInstanceOf(NftTransaction)
        await transaction.wait()
        await waitSecondsBeforeThanNewTx(10)

        const newSigner = await nft.transfer(
            receiverTestAddress,
            senderTestAddress,
            nftTestAddress2
        )

        void (await newSigner.sign(receiverPrivateKey)).send()
    })
})
