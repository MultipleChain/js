import { Provider } from '../src/services/Provider.ts'

export const provider = new Provider({
    id: 11155111,
    hexId: '0xaa36a7',
    mainnetId: 1,
    name: 'Ethereum Sepolia Testnet (QR)',
    explorerUrl: 'https://sepolia.etherscan.io/',
    rpcUrl: process.env.RPC_URL as unknown as string,
    wsUrl: process.env.WS_URL as unknown as string,
    nativeCurrency: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18
    }
})
