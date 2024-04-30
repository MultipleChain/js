import { mergeConfig, defineConfig } from 'vitest/config'
import mainConfig from '../../../vite.config.ts'

export default mergeConfig(
    mainConfig,
    defineConfig({
        test: {
            setupFiles: ['./tests/setup.ts']
        }
    })
)
