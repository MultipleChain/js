import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        wsUrl: 'wss://cold-bold-tent.solana-devnet.quiknode.pro/a1d29ff1425c0c05510c08e98d7ce2d22a8e277c'
    })
}

export { provider }
