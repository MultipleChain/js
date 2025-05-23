import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            coverage: {
                provider: 'istanbul',
                include: ['**/packages/**/src/**', '**/packages/networks/**/src/**'],
                exclude: [
                    '**/types/**',
                    '**/browser/**',
                    '**/index.ts/**',
                    '**/boilerplate/**',
                    '**/networks/**/src/services/TransactionListener.ts'
                ]
            },
            watch: false,
            maxConcurrency: 1,
            sequence: {
                shuffle: false,
                concurrent: false
            },
            testTimeout: 180000,
            environment: 'node',
            exclude: [...configDefaults.exclude, 'e2e/*', '**/boilerplate/**', '**/ton/**'],
            root: fileURLToPath(new URL('./', import.meta.url)),
            setupFiles: [
                './packages/networks/evm-chains/tests/setup.ts',
                './packages/networks/bitcoin/tests/setup.ts',
                './packages/networks/solana/tests/setup.ts',
                './packages/networks/tron/tests/setup.ts',
                './packages/networks/xrpl/tests/setup.ts',
                './packages/networks/sui/tests/setup.ts',
                './packages/networks/ton/tests/setup.ts'
            ]
        }
    })
)
