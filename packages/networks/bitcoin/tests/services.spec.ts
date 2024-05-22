import { describe, it, expect } from 'vitest'

import { provider } from './setup.ts'
import { Provider } from '../src/services/Provider.ts'
import { TransactionListener } from '../src/services/TransactionListener.ts'
import { TransactionTypeEnum } from '@multiplechain/types'
import { CoinTransaction } from '../src/models/CoinTransaction.ts'
import { Coin } from '../src/assets/Coin.ts'
import { sleep } from '@multiplechain/utils'

const senderTestAddress = String(process.env.BTC_SENDER_ADDRESS)
const receiverTestAddress = String(process.env.BTC_RECEIVER_ADDRESS)
const senderPrivateKey = String(process.env.BTC_SENDER_PRIVATE_KEY)
const listenerTestIsActive = Boolean(process.env.BTC_LISTENER_TEST_IS_ACTIVE !== 'false')

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
    if (!listenerTestIsActive) {
        it('No test is active', () => {
            expect(true).toBe(true)
        })
        return
    }

    it('Coin', async () => {
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
})
