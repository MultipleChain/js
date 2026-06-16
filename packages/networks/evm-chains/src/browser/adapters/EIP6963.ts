export interface EIP1193Provider {
    request: (payload: { method: string; params?: any[] | object }) => Promise<any>
    on: (eventName: string, callback: (...args: any[]) => void) => void
}

export interface EIP6963ProviderInfo {
    uuid: string
    name: string
    icon: string
    rdns?: string
}

export interface EIP6963ProviderDetail {
    info: EIP6963ProviderInfo
    provider: EIP1193Provider
}

export interface EVMProviderDetected extends EIP6963ProviderDetail {
    accounts: string[]
    request?: EIP1193Provider['request']
}

export interface EIP6963AnnounceProviderEvent extends Event {
    detail: EIP6963ProviderDetail
}

/**
 * EIP-6963 (Multi Injected Provider Discovery) store.
 *
 * When multiple wallet extensions are installed they fight over `window.ethereum`
 * (e.g. Trust Wallet overrides it and even spoofs `isMetaMask`). EIP-6963 solves
 * this by letting every wallet announce itself with a unique `rdns`, so we can
 * reach the real provider regardless of who owns `window.ethereum`.
 */
const announcedProviders: EIP6963ProviderDetail[] = []

const requestProviders = (): void => {
    if (typeof window === 'undefined') {
        return
    }
    window.dispatchEvent(new Event('eip6963:requestProvider'))
}

if (typeof window !== 'undefined') {
    window.addEventListener('eip6963:announceProvider', (event: Event) => {
        const { detail } = event as EIP6963AnnounceProviderEvent
        if (!announcedProviders.some((p) => p.info.uuid === detail.info.uuid)) {
            announcedProviders.push(detail)
        }
    })
    // Ask any already-injected wallets to announce themselves.
    requestProviders()
}

/**
 * Returns all wallet providers that have announced themselves through EIP-6963.
 * @returns announced provider details
 */
export const getEIP6963Providers = (): EIP6963ProviderDetail[] => {
    // Re-request to catch wallets that were injected late. Announcements are
    // dispatched synchronously in response, so the store is up to date right after.
    requestProviders()
    return announcedProviders
}

/**
 * Resolves a specific wallet provider by its reverse-DNS identifier (e.g. `io.metamask`).
 * @param rdns - reverse-DNS identifier of the wallet
 * @returns the matching provider, if announced
 */
export const getEIP6963ProviderByRdns = (rdns: string): EIP1193Provider | undefined => {
    return getEIP6963Providers().find((p) => p.info.rdns === rdns)?.provider
}
