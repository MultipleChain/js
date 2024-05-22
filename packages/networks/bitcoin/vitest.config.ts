import { mergeConfig, defineConfig } from 'vitest/config'
import mainConfig from '../../../vite.config.ts'

export default mergeConfig(
    mainConfig,
    defineConfig({
        test: {
            testTimeout: 600000,
            setupFiles: ['./tests/setup.ts']
        }
    })
)
