import { mergeConfig, defineConfig } from 'vitest/config'
import mainConfig from '../../../vite.config'

export default mergeConfig(
    mainConfig,
    defineConfig({
        test: {
            testTimeout: 180000,
            setupFiles: ['./tests/setup.ts']
        }
    })
)
