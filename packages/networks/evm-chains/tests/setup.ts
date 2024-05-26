import { Provider } from '../src/services/Provider'

let provider: Provider

try {
    provider = Provider.instance
} catch (e) {
    provider = new Provider({
        id: 11155111,
        hexId: '0xaa36a7',
        mainnetId: 1,
        testnet: true,
        name: 'Ethereum Sepolia Testnet (QR)',
        explorerUrl: 'https://sepolia.etherscan.io/',
        rpcUrl: process.env.EVM_RPC_URL as unknown as string,
        wsUrl: process.env.EVM_WS_URL as unknown as string,
        nativeCurrency: {
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18
        }
    })
}

export { provider }
