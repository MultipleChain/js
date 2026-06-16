import { Provider } from '../src/services/Provider'
import { createMockClient } from './mockClient'

const provider = new Provider({
    testnet: true,
    wsUrl: 'wss://rpc.testnet.sui.io:443',
    rpcUrl: 'https://fullnode.testnet.sui.io:443'
})

provider.client = createMockClient()

export { provider }
