import { vi } from 'vitest'
import { xrpToDrops } from 'xrpl'
import type Client from '../src/services/Client'
import {
    accountBalances,
    mockLatestLedger,
    senderTestAddress,
    receiverTestAddress,
    transactionFixtures,
    transferTestAmount
} from './fixtures'

const balances = { ...accountBalances }

const addBalance = (owner: string, amount: number): void => {
    balances[owner] = (balances[owner] ?? 0) + amount
}

export const createMockClient = (): Client => {
    return {
        request: vi.fn(async (method: string, params: Record<string, unknown>) => {
            if (method === 'server_info') {
                return {
                    info: {
                        validated_ledger: {
                            reserve_base_xrp: 1
                        }
                    }
                }
            }

            if (method === 'fee') {
                return {
                    result: {
                        drops: {
                            minimum_fee: '12'
                        }
                    }
                }
            }

            if (method === 'ledger') {
                return {
                    result: {
                        ledger_index: mockLatestLedger
                    }
                }
            }

            if (method === 'tx') {
                const txId = String(params.transaction)
                const fixture = transactionFixtures[txId]
                if (!fixture) {
                    return {
                        result: {
                            error: 'txnNotFound',
                            error_message: 'Transaction not found.'
                        }
                    }
                }
                return { result: structuredClone(fixture) }
            }

            if (method === 'account_info') {
                const account = String(params.account)
                const balance = balances[account]

                if (balance === undefined) {
                    return {
                        result: {
                            status: 'error',
                            error: 'actNotFound'
                        }
                    }
                }

                return {
                    result: {
                        account_data: {
                            Balance: xrpToDrops(balance)
                        }
                    }
                }
            }

            throw new Error(`Unhandled mock RPC method: ${method}`)
        }),
        getMinimumReserve: vi.fn(async () => 1),
        getAccountInfo: vi.fn(async (address: string) => {
            const balance = balances[address]

            if (balance === undefined) {
                return {
                    result: {
                        status: 'error',
                        error: 'actNotFound'
                    }
                }
            }

            return {
                result: {
                    account_data: {
                        Balance: xrpToDrops(balance)
                    }
                }
            }
        }),
        isError: vi.fn((response: { status?: string }) => response?.status === 'error'),
        getBalance: vi.fn(async (address: string) => {
            const balance = balances[address]
            if (balance === undefined) {
                return '0'
            }
            return xrpToDrops(balance)
        }),
        getLedger: vi.fn(async () => ({
            result: {
                ledger_index: mockLatestLedger
            }
        })),
        getFee: vi.fn(async () => '12'),
        getTransaction: vi.fn(async (txId: string) => {
            const fixture = transactionFixtures[txId]
            if (!fixture) {
                throw new Error('Transaction not found.')
            }
            return structuredClone(fixture) as any
        })
    } as unknown as Client
}

export const registerSentTransaction = (hash: string): void => {
    const template = Object.values(transactionFixtures)[0]
    transactionFixtures[hash] = {
        ...structuredClone(template),
        hash
    }
    addBalance(receiverTestAddress, transferTestAmount)
}

export { senderTestAddress, receiverTestAddress }
