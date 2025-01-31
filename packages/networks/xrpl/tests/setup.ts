import { Provider } from '../src/services/Provider'

let provider: Provider

// Mainnet
// wss://xrplcluster.com
// https://xrplcluster.com

// Testnet
// wss://s.altnet.rippletest.net:51233/
// https://s.altnet.rippletest.net:51234/

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        testnet: true,
        rpcUrl: 'https://s.altnet.rippletest.net:51234',
        wsUrl: 'wss://s.altnet.rippletest.net:51233'
    })
}

export { provider }
