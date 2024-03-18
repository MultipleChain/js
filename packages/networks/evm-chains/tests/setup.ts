import { Provider } from '../src/services/Provider.ts'

export const provider = new Provider({
    id: 11155111,
    hexId: '0xaa36a7',
    mainnetId: 1,
    name: 'Ethereum Sepolia Testnet (QR)',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    wsUrl: 'wss://sepolia.infura.io/ws/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://sepolia.etherscan.io/',
    nativeCurrency: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18
    }
})
