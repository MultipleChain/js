import { tomMist } from '../src/utils'

const sender = String(process.env.SUI_MODEL_TEST_SENDER)
const receiver = String(process.env.SUI_MODEL_TEST_RECEIVER)
const tokenType = String(process.env.SUI_TOKEN_TYPE_ADDRESS)
const nftType = String(process.env.SUI_NFT_TYPE_ADDRESS)
const nftObjectId = String(process.env.SUI_MODEL_NFT_OBJECT_ID)
const nftMetadataObjectId = String(process.env.SUI_NFT_OBJECT_ID)
const nftBalanceObjectId = String(process.env.SUI_MODEL_NFT_OBJECT_ID)

export { nftObjectId }

export const suiTransferTx = String(process.env.SUI_TRANSFER_TX)
export const tokenTransferTx = String(process.env.SUI_TOKEN_TRANSFER_TX)
export const nftTransferTx = String(process.env.SUI_NFT_TRANSFER_TX)

export const coinAmount = Number(process.env.SUI_MODEL_COIN_AMOUNT)
export const tokenAmount = Number(process.env.SUI_MODEL_TOKEN_AMOUNT)

export const coinBalanceTestAmount = Number(process.env.SUI_COIN_BALANCE_TEST_AMOUNT)
export const tokenBalanceTestAmount = Number(process.env.SUI_TOKEN_BALANCE_TEST_AMOUNT)
export const nftBalanceTestAmount = Number(process.env.SUI_NFT_BALANCE_TEST_AMOUNT)

export const balanceTestAddress = String(process.env.SUI_BALANCE_TEST_ADDRESS)
export const senderTestAddress = String(process.env.SUI_SENDER_TEST_ADDRESS)
export const receiverTestAddress = String(process.env.SUI_RECEIVER_TEST_ADDRESS)
export const tokenTestAddress = String(process.env.SUI_TOKEN_TYPE_ADDRESS)
export const nftTestAddress = String(process.env.SUI_NFT_TYPE_ADDRESS)

export const transferTestAmount = Number(process.env.SUI_TRANSFER_TEST_AMOUNT)
export const tokenTransferTestAmount = Number(process.env.SUI_TOKEN_TRANSFER_TEST_AMOUNT)

export const mockBlockNumber = 205822572
export const mockBlockTimestamp = 1749451910786
export const mockLatestCheckpoint = 206000000
export const mockFeeMist = 1997880
export const mockDigest = '38rQ6ThScL69gSLaWez9i8kj3CEw6eyqjkCoNPbcxPKN'
export const mockCoinObjectId = `0x${'a'.repeat(64)}`
export const mockTokenCoinObjectId = `0x${'b'.repeat(64)}`

const successEffects = {
    status: { status: 'success' as const },
    gasUsed: {
        storageCost: String(mockFeeMist),
        storageRebate: '0',
        computationCost: '0'
    }
}

const programmableTransaction = (
    amountMist: number,
    extraInputs: Array<Record<string, unknown>> = []
) => ({
    kind: 'ProgrammableTransaction' as const,
    inputs: [
        { type: 'pure' as const, valueType: 'address', value: receiver },
        { type: 'pure' as const, valueType: 'u64', value: amountMist },
        ...extraInputs
    ],
    transactions: []
})

export const transactionFixtures: Record<string, Record<string, unknown>> = {
    [suiTransferTx]: {
        digest: suiTransferTx,
        checkpoint: String(mockBlockNumber),
        timestampMs: String(mockBlockTimestamp),
        transaction: {
            data: {
                sender,
                transaction: programmableTransaction(tomMist(coinAmount))
            }
        },
        effects: successEffects,
        objectChanges: [
            { type: 'mutated', objectType: '0x2::coin::Coin<0x2::sui::SUI>' },
            { type: 'created', objectType: '0x2::coin::Coin<0x2::sui::SUI>' }
        ],
        balanceChanges: [{}, {}]
    },
    [tokenTransferTx]: {
        digest: tokenTransferTx,
        checkpoint: String(mockBlockNumber),
        timestampMs: String(mockBlockTimestamp),
        transaction: {
            data: {
                sender,
                transaction: programmableTransaction(
                    Math.round(tokenAmount * 1_000_000_000)
                )
            }
        },
        effects: successEffects,
        objectChanges: [
            { type: 'published', objectType: '0x2::package::Package' },
            { type: 'mutated', objectType: `0x2::coin::Coin<${tokenType}>` },
            { type: 'mutated', objectType: `0x2::coin::Coin<${tokenType}>` }
        ],
        balanceChanges: [{}, {}]
    },
    [nftTransferTx]: {
        digest: nftTransferTx,
        checkpoint: String(mockBlockNumber),
        timestampMs: String(mockBlockTimestamp),
        transaction: {
            data: {
                sender,
                transaction: programmableTransaction(0, [
                    {
                        type: 'object',
                        objectType: 'immOrOwnedObject',
                        objectId: nftObjectId
                    }
                ])
            }
        },
        effects: successEffects,
        objectChanges: [
            { type: 'mutated', objectType: nftType },
            { type: 'transferred', objectType: nftType }
        ],
        balanceChanges: [{}]
    }
}

export const tokenMetadata = {
    decimals: 9,
    name: 'Test USDC',
    symbol: 'TUSDC',
    description: 'Test token',
    iconUrl: null
}

export const nftMetadataById: Record<string, Record<string, unknown>> = {
    [nftMetadataObjectId]: {
        name: 'Test NFT 1',
        symbol: 'Test NFT 1',
        description: 'Test NFT 1',
        image: 'https://i.pinimg.com/736x/b6/51/40/b651403a18268e29a362121ab58541ce.jpg',
        owner: senderTestAddress
    },
    [nftBalanceObjectId]: {
        name: 'Test NFT 1',
        symbol: 'Test NFT 1',
        description: 'Test NFT 1',
        image: 'https://i.pinimg.com/736x/b6/51/40/b651403a18268e29a362121ab58541ce.jpg',
        owner: receiverTestAddress
    }
}

export const totalSupplyRaw = String(10_000_000_000_000_000)
