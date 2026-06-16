import { vi } from 'vitest'
import type { SuiClient } from '@mysten/sui/client'
import { tomMist } from '../src/utils'
import {
    balanceTestAddress,
    mockCoinObjectId,
    mockTokenCoinObjectId,
    mockDigest,
    mockLatestCheckpoint,
    nftMetadataById,
    nftTestAddress,
    receiverTestAddress,
    senderTestAddress,
    tokenMetadata,
    tokenTestAddress,
    totalSupplyRaw,
    transactionFixtures,
    coinBalanceTestAmount,
    tokenBalanceTestAmount,
    nftBalanceTestAmount,
    transferTestAmount,
    tokenTransferTestAmount
} from './fixtures'

const mistBalance = (amount: number): string => String(tomMist(amount))

const balances: Record<string, Record<string, string>> = {
    [balanceTestAddress]: {
        default: mistBalance(coinBalanceTestAmount),
        [tokenTestAddress]: mistBalance(tokenBalanceTestAmount)
    },
    [senderTestAddress]: {
        default: mistBalance(10),
        [tokenTestAddress]: mistBalance(1000)
    },
    [receiverTestAddress]: {
        default: mistBalance(1),
        [tokenTestAddress]: mistBalance(0)
    }
}

const getBalanceKey = (coinType?: string): string => {
    if (!coinType || coinType === '0x2::sui::SUI') {
        return 'default'
    }
    return coinType
}

const getBalanceAmount = (owner: string, coinType?: string): string => {
    return balances[owner]?.[getBalanceKey(coinType)] ?? '0'
}

const addBalanceAmount = (owner: string, amount: number, coinType?: string): void => {
    const key = getBalanceKey(coinType)
    balances[owner] ??= {}
    const current = BigInt(balances[owner][key] ?? '0')
    balances[owner][key] = String(current + BigInt(mistBalance(amount)))
}

const buildObjectResponse = (id: string): Record<string, unknown> => {
    const nftMetadata = nftMetadataById[id]

    if (nftMetadata) {
        return {
            data: {
                objectId: id,
                version: '1',
                digest: mockDigest,
                owner: { AddressOwner: nftMetadata.owner },
                content: {
                    dataType: 'moveObject',
                    fields: {
                        name: nftMetadata.name,
                        symbol: nftMetadata.symbol,
                        description: nftMetadata.description,
                        image: nftMetadata.image
                    }
                }
            }
        }
    }

    return {
        data: {
            objectId: id,
            version: '1',
            digest: mockDigest,
            owner: { AddressOwner: senderTestAddress },
            content: {
                dataType: 'moveObject',
                type: '0x2::coin::Coin<0x2::sui::SUI>',
                hasPublicTransfer: true,
                fields: { balance: mistBalance(10) }
            }
        }
    }
}

export const createMockClient = (): SuiClient => {
    let sentDigest = mockDigest

    return {
        getTransactionBlock: vi.fn(async ({ digest }: { digest: string }) => {
            const fixture = transactionFixtures[digest]
            if (!fixture) {
                throw new Error(
                    `Could not find the referenced transaction [TransactionDigest(${digest})].`
                )
            }
            return structuredClone(fixture)
        }),
        waitForTransaction: vi.fn(async () => undefined),
        getLatestCheckpointSequenceNumber: vi.fn(async () => mockLatestCheckpoint),
        getBalance: vi.fn(async ({ owner, coinType }: { owner: string; coinType?: string }) => ({
            coinType: coinType ?? '0x2::sui::SUI',
            coinObjectCount: 1,
            totalBalance: getBalanceAmount(owner, coinType)
        })),
        getCoinMetadata: vi.fn(async ({ coinType }: { coinType: string }) => {
            if (coinType === tokenTestAddress) {
                return tokenMetadata
            }
            return null
        }),
        getTotalSupply: vi.fn(async ({ coinType }: { coinType: string }) => {
            if (coinType === tokenTestAddress) {
                return { value: totalSupplyRaw }
            }
            return { value: '0' }
        }),
        getCoins: vi.fn(async ({ owner, coinType }: { owner: string; coinType?: string }) => {
            const isSui = !coinType || coinType === '0x2::sui::SUI'
            const coinObjectId = isSui ? mockCoinObjectId : mockTokenCoinObjectId

            return {
                data: [
                    {
                        coinObjectId,
                        balance: getBalanceAmount(owner, coinType),
                        version: '1',
                        digest: mockDigest,
                        previousTransaction: mockDigest
                    }
                ]
            }
        }),
        getObject: vi.fn(async ({ id }: { id: string }) => {
            if (id === '0x1') {
                return { data: { objectId: '0x1' } }
            }
            return buildObjectResponse(id)
        }),
        multiGetObjects: vi.fn(async ({ ids }: { ids: string[] }) => ids.map(buildObjectResponse)),
        getOwnedObjects: vi.fn(
            async ({ owner, filter }: { owner: string; filter?: { StructType?: string } }) => {
                if (filter?.StructType === nftTestAddress && owner === balanceTestAddress) {
                    return {
                        data: Array.from({ length: nftBalanceTestAmount }, (_, index) => ({
                            data: { objectId: `nft-${index}` }
                        }))
                    }
                }
                if (filter?.StructType === nftTestAddress) {
                    return { data: [{ data: { objectId: Object.keys(nftMetadataById)[0] } }] }
                }
                return { data: [] }
            }
        ),
        getReferenceGasPrice: vi.fn(async () => '1000'),
        dryRunTransactionBlock: vi.fn(async () => ({
            effects: {
                status: { status: 'success' },
                gasUsed: { computationCost: '1000', storageCost: '100', storageRebate: '0' }
            },
            balanceChanges: []
        })),
        executeTransactionBlock: vi.fn(async () => {
            sentDigest = `mockTx${Date.now()}`
            const template = Object.values(transactionFixtures)[0]
            transactionFixtures[sentDigest] = {
                ...structuredClone(template),
                digest: sentDigest
            }
            addBalanceAmount(receiverTestAddress, transferTestAmount)
            addBalanceAmount(receiverTestAddress, tokenTransferTestAmount, tokenTestAddress)
            return { digest: sentDigest, effects: { status: { status: 'success' } } }
        })
    } as unknown as SuiClient
}
