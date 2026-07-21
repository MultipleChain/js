import { describe, it, expect } from 'vitest'
import WebSocket from 'isomorphic-ws'
import { sleep } from '@multiplechain/utils'
import { Coin } from '../src/assets/Coin'
import { TransactionTypeEnum } from '@multiplechain/types'
import { CoinTransaction } from '../src/models/CoinTransaction'
import { TransactionListener } from '../src/services/TransactionListener'

const senderTestAddress = String(process.env.BTC_SENDER_ADDRESS)
const receiverTestAddress = String(process.env.BTC_RECEIVER_ADDRESS)
const senderPrivateKey = String(process.env.BTC_SENDER_PRIVATE_KEY)
const transferAmount = Number(process.env.BTC_TRANSFER_AMOUNT ?? 0.0001)

// This test broadcasts a REAL testnet transaction and spends a sender UTXO, so
// it is opt-in and OFF by default. Run it on its own (keep the broadcasting
// listener test in services.spec.ts disabled) so two tests do not try to spend
// the same UTXOs in one run:
//   BTC_CATCHUP_TEST_IS_ACTIVE=true BTC_LISTENER_TEST_IS_ACTIVE=false pnpm test
const catchUpTestIsActive = process.env.BTC_CATCHUP_TEST_IS_ACTIVE === 'true'

describe('Transaction Listener — reconnect catch-up (testnet, broadcast)', () => {
    if (!catchUpTestIsActive) {
        it('No test is active', () => {
            expect(true).toBe(true)
        })
        return
    }

    // Validates the headline fix: a transaction the live socket never pushed
    // (because it was already in the mempool before subscribing) is still
    // recovered by the REST catch-up that runs after a reconnect.
    it('Coin — recovers a transaction missed by the live socket', async () => {
        // 1) Broadcast BEFORE any listener is subscribed. mempool.space only
        //    pushes transactions it sees after subscription, so the live socket
        //    will never deliver this one — only the reconnect catch-up can.
        const signer = await new Coin().transfer(
            senderTestAddress,
            receiverTestAddress,
            transferAmount
        )
        const txId = await (await signer.sign(senderPrivateKey)).send()

        // 2) Let the transaction reach the REST mempool that catch-up reads.
        await sleep(8000)

        const listener = new TransactionListener(TransactionTypeEnum.COIN, {
            signer: senderTestAddress,
            receiver: receiverTestAddress
        })

        const waitForCatchUp = async (): Promise<any> => {
            return await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    listener.stop()
                    reject(new Error('Catch-up did not recover the transaction in time'))
                }, 120000)

                void listener
                    .on((transaction) => {
                        clearTimeout(timeout)
                        listener.stop()
                        resolve(transaction)
                    })
                    .then(async () => {
                        // The first connection subscribes but will NOT receive the
                        // pre-existing transaction. Wait for it to open, then force a
                        // reconnect so the catch-up path runs and recovers the tx.
                        for (let i = 0; i < 60; i++) {
                            if (listener.webSocket?.readyState === WebSocket.OPEN) {
                                break
                            }
                            await sleep(250)
                        }
                        await sleep(500) // let the 'open' handler mark the connection established
                        listener.webSocket.close()
                    })
                    .catch(reject)
            })
        }

        const received = await waitForCatchUp()

        expect(received).toBeInstanceOf(CoinTransaction)
        expect(received.id).toBe(txId)
    })
})
