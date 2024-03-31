import { Provider } from '../src/services/Provider.ts'

export const provider = new Provider({
    id: 11155111,
    hexId: '0xaa36a7',
    mainnetId: 1,
    name: 'Ethereum Sepolia Testnet (QR)',
    rpcUrl: 'https://dimensional-icy-tent.ethereum-sepolia.quiknode.pro/e6a31d965b3ab5fc57d5980d187121f1894c0eb4/',
    wsUrl: 'wss://dimensional-icy-tent.ethereum-sepolia.quiknode.pro/e6a31d965b3ab5fc57d5980d187121f1894c0eb4/',
    explorerUrl: 'https://sepolia.etherscan.io/',
    nativeCurrency: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18
    }
})
