import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        wsUrl: 'wss://rpc.devnet.sui.io:443',
        rpcUrl: 'https://fullnode.devnet.sui.io:443'
    })
}

export { provider }
