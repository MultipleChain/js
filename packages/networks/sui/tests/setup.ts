import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        wsUrl: 'wss://rpc.testnet.sui.io:443',
        rpcUrl: 'https://fullnode.testnet.sui.io:443'
    })
}

export { provider }
