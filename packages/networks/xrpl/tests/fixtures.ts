import { xrpToDrops } from 'xrpl'

const sender = String(process.env.XRP_MODEL_TEST_SENDER)
const receiver = String(process.env.XRP_MODEL_TEST_RECEIVER)

export const xrpTransferTx = String(process.env.XRP_TRANSFER_TX)
export const coinAmount = Number(process.env.XRP_MODEL_COIN_AMOUNT)
export const modelFee = Number(process.env.XRP_MODEL_FEE)
export const mockBlockNumber = Number(process.env.XRP_MODEL_BLOCK_NUMBER)
export const mockBlockTimestamp = Number(process.env.XRP_MODEL_BLOCK_TIMESTAMP)
export const mockLatestLedger = Number(process.env.XRP_MODEL_LATEST_LEDGER)

export const senderTestAddress = String(process.env.XRP_SENDER_ADDRESS)
export const receiverTestAddress = String(process.env.XRP_RECEIVER_ADDRESS)
export const balanceTestAddress = String(process.env.XRP_BALANCE_TEST_ADDRESS)
export const coinBalanceTestAmount = Number(process.env.XRP_COIN_BALANCE_TEST_AMOUNT)
export const transferTestAmount = Number(process.env.XRP_TRANSFER_AMOUNT)

const buildPaymentTx = (hash: string) => ({
    hash,
    Account: sender,
    Destination: receiver,
    Amount: xrpToDrops(coinAmount),
    Fee: xrpToDrops(modelFee),
    TransactionType: 'Payment',
    ledger_index: mockBlockNumber,
    date: mockBlockTimestamp,
    meta: {
        TransactionResult: 'tesSUCCESS'
    }
})

export const transactionFixtures: Record<string, Record<string, unknown>> = {
    [xrpTransferTx]: buildPaymentTx(xrpTransferTx)
}

export const accountBalances: Record<string, number> = {
    [balanceTestAddress]: coinBalanceTestAmount,
    [senderTestAddress]: 10,
    [receiverTestAddress]: 1
}
