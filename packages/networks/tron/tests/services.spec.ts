import { describe, it, expect } from 'vitest'

import { provider } from './setup.ts'
import { Provider } from '../src/services/Provider.ts'

describe('Provider', () => {
    it('isTestnet', () => {
        expect(provider.isTestnet()).toBe(true)
    })

    it('instance', () => {
        expect(Provider.instance).toBe(provider)
    })

    it('checkRpcConnection', async () => {
        expect(
            await provider.checkRpcConnection(process.env.EVM_RPC_URL as unknown as string)
        ).toBe(true)
    })

    it('checkWsConnection', async () => {
        expect(await provider.checkWsConnection(process.env.EVM_WS_URL as unknown as string)).toBe(
            true
        )
    })
})
