import type { EIP1193Provider } from './EIP6963.ts'

declare global {
    interface Window {
        ethereum?: EIP1193Provider & {
            isTrust?: boolean
            isMetaMask?: boolean
        }
        trustwallet?: EIP1193Provider
    }
}
