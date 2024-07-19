import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        wsUrl: 'wss://methodical-greatest-orb.solana-devnet.quiknode.pro/c7b6d81c0b58136705b99397e0f396dcee01f748/'
    })
}

export { provider }
