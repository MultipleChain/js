import { Provider } from './Provider'
import { Transaction } from '../models/Transaction'
import { objectsEqual } from '@multiplechain/utils'
import { NftTransaction } from '../models/NftTransaction'
import { CoinTransaction } from '../models/CoinTransaction'
import { TokenTransaction } from '../models/TokenTransaction'
import { ContractTransaction } from '../models/ContractTransaction'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import {
    PublicKey,
    SystemProgram,
    type Commitment,
    type Logs,
    type LogsFilter,
    type ParsedAccountData,
    type ParsedInstruction,
    type PartiallyDecodedInstruction
} from '@solana/web3.js'
import type {
    DynamicTransactionType,
    TransactionListenerInterface,
    DynamicTransactionListenerFilterType,
    TransactionId,
    WalletAddress,
    ContractAddress,
    TransferAmount,
    NftId
} from '@multiplechain/types'
import {
    ErrorTypeEnum,
    TransactionTypeEnum,
    TransactionListenerProcessIndex
} from '@multiplechain/types'

type TransactionListenerTriggerType<T extends TransactionTypeEnum> = DynamicTransactionType<
    T,
    Transaction,
    ContractTransaction,
    CoinTransaction,
    TokenTransaction,
    NftTransaction
>

type TransactionListenerCallbackType<
    T extends TransactionTypeEnum,
    Transaction = TransactionListenerTriggerType<T>
> = (transaction: Transaction) => void

export class TransactionListener<
    T extends TransactionTypeEnum,
    DTransaction extends TransactionListenerTriggerType<T>,
    CallBackType extends TransactionListenerCallbackType<T>
> implements TransactionListenerInterface<T, DTransaction, CallBackType>
{
    /**
     * Transaction type
     */
    type: T

    /**
     * Provider
     */
    provider: Provider

    /**
     * Listener status
     */
    status: boolean = false

    /**
     * Connected status
     */
    connected: boolean = false

    /**
     * Whether stop() was called intentionally
     */
    private intentionalStop = false

    /**
     * Reconnect backoff in milliseconds
     */
    private reconnectDelayMs = 1_000

    /**
     * Pending reconnect timer
     */
    private reconnectTimer?: ReturnType<typeof setTimeout>

    /**
     * Active logs subscription id
     */
    private logsSubscriptionId?: number

    /**
     * Websocket close handler
     */
    private wsCloseHandler?: () => void
    private resilienceBound = false

    /**
     * Transaction listener callback
     */
    callbacks: CallBackType[] = []

    /**
     * Dynamic stop method
     */
    dynamicStop: () => void = () => {}

    /**
     * Triggered transactions
     */
    triggeredTransactions: TransactionId[] = []

    /**
     * Transaction listener filter
     */
    filter?: DynamicTransactionListenerFilterType<T> | Record<string, never>

    /**
     * @param type - Transaction type
     * @param filter - Transaction listener filter
     * @param provider - Provider
     */
    constructor(type: T, filter?: DynamicTransactionListenerFilterType<T>, provider?: Provider) {
        this.type = type
        this.filter = filter ?? {}
        this.provider = provider ?? Provider.instance
    }

    /**
     * Close the listener
     */
    stop(): void {
        if (this.status) {
            this.status = false
            this.intentionalStop = true
            this.connected = false
            this.clearReconnectTimer()
            this.unbindResilience()
            this.dynamicStop()
        }
    }

    /**
     * Start the listener
     */
    start(): void {
        if (!this.status) {
            this.status = true
            this.intentionalStop = false
            this.restartSubscriptions()
        }
    }

    /**
     * Get the listener status
     * @returns Listener status
     */
    getStatus(): boolean {
        return this.status
    }

    /**
     * Listen to the transaction events
     * @param callback - Transaction listener callback
     * @returns Listener status
     */
    async on(callback: CallBackType): Promise<boolean> {
        if (this.provider.node.wsUrl === undefined || this.provider.node.wsUrl === '') {
            throw new Error(ErrorTypeEnum.WS_CONNECTION_FAILED)
        }

        this.callbacks.push(callback)
        this.start()

        return true
    }

    /**
     * Trigger the event when a transaction is detected
     * @param transaction - Transaction data
     */
    trigger<T extends TransactionTypeEnum>(transaction: TransactionListenerTriggerType<T>): void {
        if (!this.triggeredTransactions.includes(transaction.id)) {
            this.triggeredTransactions.push(transaction.id)
            this.callbacks.forEach((callback) => {
                callback(transaction as unknown as DTransaction)
            })
        }
    }

    /**
     * General transaction process
     */
    generalProcess(): void {
        if (this.filter?.signer === undefined) {
            this.subscribeLogs(
                'all',
                (logs) => {
                    this.trigger(new Transaction(logs.signature))
                },
                'recent'
            )
        } else {
            const signer = this.filter.signer
            this.subscribeLogs(
                new PublicKey(signer),
                async (logs) => {
                    try {
                        const transaction = new Transaction(logs.signature)
                        const data = await transaction.getData()

                        if (data === null) {
                            return
                        }

                        if (
                            signer.toLowerCase() !== (await transaction.getSigner()).toLowerCase()
                        ) {
                            return
                        }

                        this.trigger(transaction)
                    } catch (error) {
                        // Maybe in future, we can add logging system
                    }
                },
                'confirmed'
            )
        }
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== undefined) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = undefined
        }
    }

    private getRpcWebSocket(): { on: (event: string, handler: () => void) => void; removeListener: (event: string, handler: () => void) => void } | undefined {
        return (this.provider.web3 as { _rpcWebSocket?: { on: (event: string, handler: () => void) => void; removeListener: (event: string, handler: () => void) => void } })._rpcWebSocket
    }

    private unbindResilience(): void {
        const rpcWs = this.getRpcWebSocket()

        if (rpcWs === undefined || this.wsCloseHandler === undefined) {
            return
        }

        rpcWs.removeListener('close', this.wsCloseHandler)
        this.wsCloseHandler = undefined
        this.resilienceBound = false
    }

    private bindResilience(): void {
        queueMicrotask(() => {
            const rpcWs = this.getRpcWebSocket()

            if (rpcWs === undefined || this.resilienceBound) {
                return
            }

            this.wsCloseHandler = (): void => {
                if (this.intentionalStop || !this.status) {
                    return
                }

                this.scheduleReconnect()
            }

            rpcWs.on('close', this.wsCloseHandler)
            this.resilienceBound = true
        })
    }

    private scheduleReconnect(): void {
        if (this.intentionalStop || !this.status || this.reconnectTimer !== undefined) {
            return
        }

        this.dynamicStop()
        this.unbindResilience()
        this.provider.resetConnection()
        this.connected = false

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined
            void this.reconnect()
        }, this.reconnectDelayMs)

        this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30_000)
    }

    private async reconnect(): Promise<void> {
        if (this.intentionalStop || !this.status) {
            return
        }

        try {
            this.connected = true
            this.restartSubscriptions()
            this.reconnectDelayMs = 1_000
        } catch {
            this.scheduleReconnect()
        }
    }

    private restartSubscriptions(): void {
        this.dynamicStop()

        const processName = TransactionListenerProcessIndex[this.type] as keyof this
        const result = (this[processName] as () => void | Promise<void>)()

        if (result instanceof Promise) {
            void result.catch(() => {
                this.scheduleReconnect()
            })
        }
    }

    private subscribeLogs(
        parameter: LogsFilter,
        callback: (logs: Logs) => void,
        commitment: Commitment = 'confirmed'
    ): void {
        this.logsSubscriptionId = this.provider.web3.onLogs(parameter, callback, commitment)
        this.connected = true

        this.dynamicStop = () => {
            if (this.logsSubscriptionId !== undefined) {
                void this.provider.web3.removeOnLogsListener(this.logsSubscriptionId)
                this.logsSubscriptionId = undefined
            }
        }

        this.bindResilience()
    }

    /**
     * @param instructions Instructions
     * @returns System program status
     */
    private isSystemProgram(
        instructions: Array<ParsedInstruction | PartiallyDecodedInstruction>
    ): boolean {
        return Boolean(
            instructions.find((instruction) => {
                return instruction.programId.equals(SystemProgram.programId)
            })
        )
    }

    /**
     * Contract transaction process
     */
    contractProcess(): void {
        const filter = this
            .filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.CONTRACT>

        const callback = async (logs: Logs): Promise<any> => {
            try {
                const transaction = new ContractTransaction(logs.signature)
                const data = await transaction.getData()

                if (data === null) {
                    return
                }

                if (this.isSystemProgram(data.transaction.message.instructions)) {
                    return
                }

                interface ParamsType {
                    signer?: WalletAddress
                    address?: ContractAddress
                }

                const expectedParams: ParamsType = {}
                const receivedParams: ParamsType = {}

                if (filter.signer !== undefined) {
                    expectedParams.signer = filter.signer.toLowerCase()
                    receivedParams.signer = (await transaction.getSigner()).toLowerCase()
                }

                if (filter.address !== undefined) {
                    expectedParams.address = filter.address.toLowerCase()
                    receivedParams.address = (await transaction.getAddress()).toLowerCase()
                }

                if (!objectsEqual(expectedParams, receivedParams)) {
                    return
                }

                this.trigger(transaction)
            } catch (error) {
                // Maybe in future, we can add logging system
            }
        }

        const address = filter.signer ?? filter.address
        const parameter = address !== undefined ? new PublicKey(address) : 'all'
        this.subscribeLogs(parameter, callback, 'confirmed')
    }

    /**
     * Coin transaction process
     */
    coinProcess(): void {
        const filter = this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.COIN>

        const parameter = new PublicKey(
            filter.signer ?? filter.sender ?? filter.receiver ?? SystemProgram.programId.toBase58()
        )

        const callback = async (logs: Logs): Promise<any> => {
            try {
                const transaction = new CoinTransaction(logs.signature)
                const data = await transaction.getData()

                if (data === null) {
                    return
                }

                if (!this.isSystemProgram(data.transaction.message.instructions)) {
                    return
                }

                interface ParamsType {
                    signer?: WalletAddress
                    sender?: WalletAddress
                    receiver?: WalletAddress
                    amount?: TransferAmount
                }

                const expectedParams: ParamsType = {}
                const receivedParams: ParamsType = {}

                if (filter.signer !== undefined) {
                    expectedParams.signer = filter.signer.toLowerCase()
                    receivedParams.signer = (await transaction.getSigner()).toLowerCase()
                }

                if (filter.sender !== undefined) {
                    expectedParams.sender = filter.sender.toLowerCase()
                    receivedParams.sender = (await transaction.getSender()).toLowerCase()
                }

                if (filter.receiver !== undefined) {
                    expectedParams.receiver = filter.receiver.toLowerCase()
                    receivedParams.receiver = (await transaction.getReceiver()).toLowerCase()
                }

                if (filter.amount !== undefined) {
                    expectedParams.amount = filter.amount
                    receivedParams.amount = await transaction.getAmount()
                }

                if (!objectsEqual(expectedParams, receivedParams)) {
                    return
                }

                this.trigger(transaction)
            } catch (error) {
                // Maybe in future, we can add logging system
            }
        }

        this.subscribeLogs(parameter, callback, 'confirmed')
    }

    private async tokenNftCondition(
        _transaction: TokenTransaction | NftTransaction
    ): Promise<boolean> {
        const filter =
            this.type === TransactionTypeEnum.TOKEN
                ? (this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.TOKEN>)
                : (this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.NFT>)

        const transaction =
            this.type === TransactionTypeEnum.TOKEN
                ? (_transaction as TokenTransaction)
                : (_transaction as NftTransaction)

        interface ParamsType {
            signer?: WalletAddress
            sender?: WalletAddress
            receiver?: WalletAddress
            address?: ContractAddress
            amount?: TransferAmount
            nftId?: NftId
        }

        const expectedParams: ParamsType = {}
        const receivedParams: ParamsType = {}

        if (filter.signer !== undefined) {
            expectedParams.signer = filter.signer.toLowerCase()
            receivedParams.signer = (await transaction.getSigner()).toLowerCase()
        }

        if (filter.sender !== undefined) {
            expectedParams.sender = filter.sender.toLowerCase()
            receivedParams.sender = (await transaction.getSender()).toLowerCase()
        }

        if (filter.receiver !== undefined) {
            expectedParams.receiver = filter.receiver.toLowerCase()
            receivedParams.receiver = (await transaction.getReceiver()).toLowerCase()
        }

        if (filter.address !== undefined) {
            expectedParams.address = filter.address.toLowerCase()
            receivedParams.address = (await transaction.getAddress()).toLowerCase()
        }

        if (this.type === TransactionTypeEnum.TOKEN) {
            const tFilter =
                filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.TOKEN>
            const tTransaction = _transaction as TokenTransaction
            if (tFilter.amount !== undefined) {
                expectedParams.amount = tFilter.amount
                receivedParams.amount = await tTransaction.getAmount()
            }
        } else {
            const nFilter = filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.NFT>
            const nTransaction = _transaction as NftTransaction
            if (nFilter.nftId !== undefined) {
                expectedParams.nftId = nFilter.nftId
                receivedParams.nftId = await nTransaction.getNftId()
            }
        }

        return objectsEqual(expectedParams, receivedParams)
    }

    private async createTokenNftListenParameter(): Promise<LogsFilter> {
        const filter =
            this.type === TransactionTypeEnum.TOKEN
                ? (this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.TOKEN>)
                : (this.filter as DynamicTransactionListenerFilterType<TransactionTypeEnum.NFT>)

        let parameter: LogsFilter = 'all'

        if (filter?.address !== undefined) {
            const tokenMintAddress = new PublicKey(filter.address)
            const accountInfo = await this.provider.web3.getParsedAccountInfo(tokenMintAddress)

            const result = accountInfo?.value
            const data = (result?.data as ParsedAccountData) ?? null
            const programId = ['spl-token', 'spl-token-2022'].includes(data?.program)
                ? result?.owner
                : null

            parameter = programId ?? tokenMintAddress ?? 'all'
            const address = filter.sender ?? filter.receiver

            if (programId !== null && address !== undefined) {
                const addressPubKey = new PublicKey(address)
                const ownerAccount = getAssociatedTokenAddressSync(
                    tokenMintAddress,
                    addressPubKey,
                    false,
                    programId
                )

                parameter = ownerAccount
            }
        }

        return parameter
    }

    /**
     * Token transaction process
     */
    async tokenProcess(): Promise<void> {
        const callback = async (logs: Logs): Promise<any> => {
            try {
                const transaction = new TokenTransaction(logs.signature)
                const data = await transaction.getData()

                if (data === null) {
                    return
                }

                if (this.isSystemProgram(data.transaction.message.instructions)) {
                    return
                }

                const instruction = transaction.findTransferInstruction(data)

                if (
                    instruction === null ||
                    (Number(instruction.parsed?.info?.amount) === 1 &&
                        instruction.parsed?.info?.tokenAmount?.decimals === 0)
                ) {
                    return
                }

                if (!(await this.tokenNftCondition(transaction))) {
                    return
                }

                this.trigger(transaction)
            } catch (error) {
                // Maybe in future, we can add logging system
            }
        }

        const parameter = await this.createTokenNftListenParameter()
        this.subscribeLogs(parameter, callback, 'confirmed')
    }

    /**
     * NFT transaction process
     */
    async nftProcess(): Promise<void> {
        const callback = async (logs: Logs): Promise<any> => {
            try {
                const transaction = new NftTransaction(logs.signature)
                const data = await transaction.getData()

                if (data === null) {
                    return
                }

                if (this.isSystemProgram(data.transaction.message.instructions)) {
                    return
                }

                const instruction = transaction.findTransferInstruction(data)

                if (
                    instruction === null ||
                    (Number(instruction.parsed?.info?.amount) !== 1 &&
                        instruction.parsed?.info?.tokenAmount?.decimals !== 0)
                ) {
                    return
                }

                if (!(await this.tokenNftCondition(transaction))) {
                    return
                }

                this.trigger(transaction)
            } catch (error) {
                // Maybe in future, we can add logging system
            }
        }

        const parameter = await this.createTokenNftListenParameter()
        this.subscribeLogs(parameter, callback, 'confirmed')
    }
}
