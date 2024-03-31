import { mergeConfig } from 'vite'
import mainConfig from '../../../vite.config.ts'

export default mergeConfig(mainConfig, {
    build: {
        lib: {
            name: 'EvmChains'
        }
    }
})
