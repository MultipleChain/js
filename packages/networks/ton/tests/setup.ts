import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        apiKey: '335ae92038c1cdb31a5446726d35d79ad36ede8fd254febd2fb55ee3cfd2d7f2'
    })
}

export { provider }
