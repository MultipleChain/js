import { vi } from 'vitest'
import { type Client as WsClient } from 'xrpl'
import { Provider } from '../src/services/Provider'
import { createMockClient } from './mockClient'
import { mockLatestLedger } from './fixtures'

const provider = new Provider({
    testnet: true
})

provider.rpc = createMockClient()
provider.ws = {
    connect: vi.fn(async () => undefined),
    disconnect: vi.fn(async () => undefined),
    isConnected: vi.fn(() => false),
    autofill: vi.fn(async (tx) => ({
        ...tx,
        Fee: '12',
        Sequence: 1,
        LastLedgerSequence: mockLatestLedger
    })) as WsClient['autofill']
} as unknown as typeof provider.ws

provider.checkRpcConnection = vi.fn(async () => true)
provider.checkWsConnection = vi.fn(async () => true)

export { provider }
