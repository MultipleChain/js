import type { EIP1193Provider } from './EIP6963.ts'

declare global {
    interface Window {
        okxwallet?: EIP1193Provider
        bitkeep?: {
            ethereum?: EIP1193Provider
        }
        phantom?: {
            ethereum?: EIP1193Provider
        }
        ethereum?: EIP1193Provider & {
            isTrust?: boolean
            isMetaMask?: boolean
        }
        trustwallet?: EIP1193Provider
    }
}
