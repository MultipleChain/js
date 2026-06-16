import { vi } from 'vitest'
import { Provider } from '../src/services/Provider'
import { createMockClient } from './mockClient'
import { mockLatestLedger } from './fixtures'

const provider = new Provider({
    testnet: true
})

provider.rpc = createMockClient()
const mockWs: typeof provider.ws = {
    connect: vi.fn(async () => undefined),
    disconnect: vi.fn(async () => undefined),
    isConnected: vi.fn(() => false),
    autofill: vi.fn(async (tx: Record<string, unknown>) => ({
        ...tx,
        Fee: '12',
        Sequence: 1,
        LastLedgerSequence: mockLatestLedger
    }))
}
provider.ws = mockWs

provider.checkRpcConnection = vi.fn(async () => true)
provider.checkWsConnection = vi.fn(async () => true)

export { provider }
