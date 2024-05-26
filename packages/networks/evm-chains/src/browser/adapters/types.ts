import type { EIP1193Provider } from './EIP6963'

export interface WindowEthereum extends EIP1193Provider {
    isTrust?: boolean
    isMetaMask?: boolean
}

declare global {
    interface Window {
        okxwallet?: EIP1193Provider
        xfi?: {
            ethereum?: EIP1193Provider
        }
        bitkeep?: {
            ethereum?: EIP1193Provider
        }
        phantom?: {
            ethereum?: EIP1193Provider
        }
        trustwallet?: EIP1193Provider
    }
}
