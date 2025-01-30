import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true
    })
}

export { provider }
