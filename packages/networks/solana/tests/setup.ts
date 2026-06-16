import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        rpcUrl: process.env.SOL_RPC_URL ?? 'https://api.devnet.solana.com',
        wsUrl: process.env.SOL_WS_URL ?? 'wss://api.devnet.solana.com'
    })
}

export { provider }
