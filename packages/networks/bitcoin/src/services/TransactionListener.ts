import type {
    TransactionTypeEnum,
    DynamicTransactionType,
    TransactionListenerInterface,
    TransactionListenerCallbackType,
    DynamicTransactionListenerFilterType
} from '@multiplechain/types'
import WebSocket from 'ws'
import { Provider } from './Provider.ts'
import { TransactionListenerProcessIndex } from '@multiplechain/types'
import { checkWebSocket, objectsEqual } from '@multiplechain/utils'
import { CoinTransaction } from '../models/CoinTransaction.ts'
import { Transaction } from '../models/Transaction.ts'
import { fromSatoshi } from '../utils.ts'

interface Values {
    txId: string
    amount?: number
    sender?: string
    receiver?: string
}

export class TransactionListener<T extends TransactionTypeEnum>
    implements TransactionListenerInterface<T>
{
    /**
     * Transaction type
     */
    type: T

    /**
     * Transaction listener callback
     */
    callbacks: TransactionListenerCallbackType[] = []

    /**
     * Transaction listener filter
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

    /**
     * Provider
     */
    provider: Provider

    /**
     * Listener status
     */
    status: boolean = false

    /**
     * Triggered transactions
     */
    triggeredTransactions: string[] = []

    /**
     * WebSocket
     */
    webSocket: WebSocket

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * @param {T} type - Transaction type
     * @param {DynamicTransactionListenerFilterType<T>} filter - Transaction listener filter
     * @param {Provider} provider - Provider
     */
    constructor(type: T, filter?: DynamicTransactionListenerFilterType<T>, provider?: Provider) {
        this.type = type
        this.filter = filter ?? {}
        this.provider = provider ?? Provider.instance
    }

    /**
     * Close the listener
     * @returns {void}
     */
    stop(): void {
        if (this.status) {
            this.status = false
            this.dynamicStop()
        }
    }

    /**
     * Start the listener
     * @returns {void}
     */
    start(): void {
        if (!this.status) {
            this.status = true
            // @ts-expect-error allow dynamic access
            this[TransactionListenerProcessIndex[this.type]]()
        }
    }

    /**
     * Get the listener status
     * @returns {boolean} Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param {TransactionListenerCallbackType} callback - Transaction listener callback
     * @returns {Promise<boolean>}
     */
    async on(callback: TransactionListenerCallbackType): Promise<boolean> {
        if (this.webSocket === undefined) {
            try {
                await checkWebSocket(this.provider.wsUrl)
                this.webSocket = new WebSocket(this.provider.wsUrl)
            } catch (error) {
                throw new Error(
                    'WebSocket connection is not available' +
                        (error instanceof Error ? ': ' + error.message : '')
                )
            }
        }

        this.start()
        this.callbacks.push(callback)

        return true
    }

    /**
     * Trigger the event when a transaction is detected
     * @param {DynamicTransactionType<T>} transaction - Transaction data
     * @returns {void}
     */
    trigger<T extends TransactionTypeEnum>(transaction: DynamicTransactionType<T>): void {
        if (!this.triggeredTransactions.includes(transaction.id)) {
            this.triggeredTransactions.push(transaction.id)
            this.callbacks.forEach((callback) => {
                callback(transaction)
            })
        }
    }

    isBlockCypherProcess(): boolean {
        return this.provider.isTestnet() || this.provider.blockCypherToken !== undefined
    }

    /**
     * Create message for the listener
     * @param {string} receiver - Receiver address
     * @returns {string} Message
     */
    createMessage(receiver?: string): string {
        let message
        if (this.isBlockCypherProcess()) {
            interface Config {
                event: string
                token: string
                address?: string
            }

            const config: Config = {
                event: 'unconfirmed-tx',
                token: this.provider.blockCypherToken ?? this.provider.defaultBlockCypherToken
            }

            if (receiver !== undefined) {
                config.address = receiver
            }

            message = JSON.stringify(config)
        } else {
            message = JSON.stringify({
                op: 'unconfirmed_sub'
            })
        }

        this.dynamicStop = () => {
            if (!this.isBlockCypherProcess()) {
                this.webSocket.send(
                    JSON.stringify({
                        op: 'unconfirmed_unsub'
                    })
                )
            }
            this.webSocket.close()
        }

        return message
    }

    /**
     * Parse the data
     * @param {any} data - Data
     * @returns {Values} Parsed data
     */
    getValues(data: any): Values {
        const values: Values = {
            txId: ''
        }

        if (this.isBlockCypherProcess()) {
            values.txId = data.hash
            values.sender = data.inputs[0].addresses[0]
            values.receiver = data.outputs[0].addresses[0]
            values.amount = fromSatoshi(data.outputs[0].value as number)
        } else {
            values.txId = data.x.hash
            values.receiver = data.x.out[0].addr
            values.sender = data.x.inputs[0].prev_out.addr
            values.amount = fromSatoshi(data.x.out[0].value as number)
        }

        return values
    }

    /**
     * General transaction process
     * @returns {void}
     */
    generalProcess(): void {
        const message = this.createMessage()

        this.webSocket.addEventListener('open', () => {
            this.webSocket.send(message)
        })

        this.webSocket.addEventListener('message', async (res) => {
            const values = this.getValues(JSON.parse(res.data as string))

            if (
                this.filter?.signer !== undefined &&
                values.sender !== this.filter.signer.toLowerCase()
            ) {
                return
            }

            this.trigger(new Transaction(values.txId))
        })
    }

    /**
     * Contract transaction process
     * @returns {void}
     */
    contractProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }

    /**
     * Coin transaction process
     * @returns {void}
     */
    coinProcess(): void {
        const filter = this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.COIN>

        if (
            filter.signer !== undefined &&
            filter.sender !== undefined &&
            filter.signer !== filter.sender
        ) {
            throw new Error(
                'Sender and signer must be the same in coin transactions. Or only one of them can be defined.'
            )
        }

        const sender = filter.sender ?? filter.signer

        const message = this.createMessage(filter.receiver)

        this.webSocket.addEventListener('open', () => {
            this.webSocket.send(message)
        })

        this.webSocket.addEventListener('message', async (res) => {
            const data = JSON.parse(res.data as string)

            interface ParamsType {
                sender?: string
                receiver?: string
            }

            const expectedParams: ParamsType = {}
            const receivedParams: ParamsType = {}

            if (String(data.event).includes('events limit reached')) {
                throw new Error('BlockCypher events limit reached.')
            }

            const values = this.getValues(data)

            console.log(values)

            if (sender !== undefined) {
                expectedParams.sender = sender.toLowerCase()
                receivedParams.sender = values.sender?.toLowerCase()
            }

            if (filter.receiver !== undefined) {
                expectedParams.receiver = filter.receiver.toLowerCase()
                receivedParams.receiver = values.receiver?.toLowerCase()
            }

            if (!objectsEqual(expectedParams, receivedParams)) {
                return
            }

            const transaction = new CoinTransaction(values.txId)

            if (filter.amount !== undefined && values.amount !== filter.amount) {
                return
            }

            this.trigger(transaction)
        })
    }

    /**
     * Token transaction process
     * @returns {void}
     */
    tokenProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }

    /**
     * NFT transaction process
     * @returns {void}
     */
    nftProcess(): void {
        throw new Error('This method is not implemented for Bitcoin.')
    }
}
