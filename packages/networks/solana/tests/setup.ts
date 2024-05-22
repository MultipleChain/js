import { Provider } from '../src/services/Provider.ts'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        wsUrl: 'wss://alien-wild-fire.solana-devnet.quiknode.pro/ad7c4490b11cd2134e022052f0b2779acb8998ad/'
    })
}

export { provider }
