import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            coverage: {
                provider: 'istanbul',
                exclude: ['**/boilerplate/**']
            },
            watch: false,
            testTimeout: 180000,
            environment: 'node',
            exclude: [...configDefaults.exclude, 'e2e/*', '**/boilerplate/**'],
            root: fileURLToPath(new URL('./', import.meta.url)),
            setupFiles: [
                './packages/networks/evm-chains/tests/setup.ts',
                './packages/networks/tron/tests/setup.ts'
            ]
        }
    })
)
