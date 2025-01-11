import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        apiKey: '0a804e1153b5dec04715342789d68c219845e3f1336da822399d7b180a5b5533'
    })
}

export { provider }
