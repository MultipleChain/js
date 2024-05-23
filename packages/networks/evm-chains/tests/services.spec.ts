import { describe, it, expect } from 'vitest'

import { provider } from './setup.ts'
import networks from '../src/services/Networks.ts'
import { Provider, type EvmNetworkConfigInterface } from '../src/services/Provider.ts'
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
import ERC20 from '../resources/ERC20.json'
import type { InterfaceAbi } from 'ethers'
import { ContractFactory, WebSocketProvider } from 'ethers'

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

describe('Networks', () => {
    it('Ethereum', () => {
        // @ts-expect-error ethereum is defined
        expect(networks.ethereum).toBeDefined()
    })

    it('findById', () => {
        // @ts-expect-error ethereum is defined
        expect(networks.findById(1)).toBe(networks.ethereum)
    })

    it('findByKey', () => {
        // @ts-expect-error ethereum is defined
        expect(networks.findByKey('ethereum')).toBe(networks.ethereum)
    })

    it('findByName', () => {
        // @ts-expect-error classic is defined
        expect(networks.findByName('Ethereum Classic')).toBe(networks.classic)
    })

    it('findBySymbol', () => {
        // @ts-expect-error arbitrum is defined
        expect(networks.findBySymbol('ETH')).toBe(networks.arbitrum)
    })

    it('findByHexId', () => {
        // @ts-expect-error ethereum is defined
        expect(networks.findByHexId('0x1')).toBe(networks.ethereum)
    })

    it('Mainnets', () => {
        expect(networks.getMainnets()).toBeInstanceOf(Array)
    })

    it('Testnets', () => {
        expect(networks.getTestnets()).toBeInstanceOf(Array)
    })

    it('All', () => {
        expect(networks.getAll()).toBeInstanceOf(Array)
    })

    it('Add', () => {
        // @ts-expect-error ethereum is defined
        networks.add('test', networks.ethereum as EvmNetworkConfigInterface)
        // @ts-expect-error ethereum is defined
        expect(networks.findByKey('test')).toBe(networks.ethereum)
    })
})

describe('Ethers', () => {
    it('Connect websocket', async () => {
        expect(await provider.ethers.connectWebSocket()).toBeInstanceOf(WebSocketProvider)
    })

    it('Websocket', async () => {
        expect(provider.ethers.webSocket).toBeInstanceOf(Object)
    })

    it('getByteCode', async () => {
        expect(await provider.ethers.getByteCode(tokenTestAddress)).toBeTypeOf('string')
    })

    it('getLastTransactions', async () => {
        expect(await provider.ethers.getLastTransactions(senderTestAddress)).toBeInstanceOf(Array)
    })

    it('getLastTransaction', async () => {
        expect(await provider.ethers.getLastTransaction(senderTestAddress)).toBe(null)
    })

    it('contractFactory', async () => {
        expect(provider.ethers.contractFactory(ERC20 as InterfaceAbi, '')).toBeInstanceOf(
            ContractFactory
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

        const signer = await new Coin().transfer(senderTestAddress, receiverTestAddress, 0.0001)

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await waitSecondsBeforeThanNewTx(2)
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
                        await waitSecondsBeforeThanNewTx(2)
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
                        await waitSecondsBeforeThanNewTx(2)
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
                        await waitSecondsBeforeThanNewTx(2)
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
            address: nftTestAddress
        })

        const nft = new NFT(nftTestAddress)
        const signer = await nft.transfer(senderTestAddress, receiverTestAddress, 9)

        const waitListenerEvent = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                void listener
                    .on((transaction) => {
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        await waitSecondsBeforeThanNewTx(2)
                        void (await signer.sign(senderPrivateKey)).send()
                    })
                    .catch(reject)
            })
        }

        const transaction = await waitListenerEvent()
        expect(transaction).toBeInstanceOf(NftTransaction)
        await transaction.wait()
        await waitSecondsBeforeThanNewTx(10)

        const newSigner = await nft.transfer(receiverTestAddress, senderTestAddress, 9)

        void (await newSigner.sign(receiverPrivateKey)).send()
    })
})
