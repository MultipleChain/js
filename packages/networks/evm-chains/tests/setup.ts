import { Provider } from '../src/services/Provider.ts'

const useCustomRpcAndWs = true

const rpcAndWs = {
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    wsUrl: 'wss://sepolia.infura.io/ws/v3/9aa3d95b3bc440fa88ea12eaa4456161'
}

if (useCustomRpcAndWs) {
    rpcAndWs.rpcUrl =
        'https://dimensional-icy-tent.ethereum-sepolia.quiknode.pro/e6a31d965b3ab5fc57d5980d187121f1894c0eb4/'
    rpcAndWs.wsUrl =
        'wss://dimensional-icy-tent.ethereum-sepolia.quiknode.pro/e6a31d965b3ab5fc57d5980d187121f1894c0eb4/'
}

export const provider = new Provider(
    Object.assign(
        {
            id: 11155111,
            hexId: '0xaa36a7',
            mainnetId: 1,
            name: 'Ethereum Sepolia Testnet (QR)',
            explorerUrl: 'https://sepolia.etherscan.io/',
            nativeCurrency: {
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18
            }
        },
        rpcAndWs
    )
)
