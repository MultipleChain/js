import { mergeConfig } from 'vite'
import mainConfig from '../../../vite.config'

export default mergeConfig(mainConfig, {
    build: {
        lib: {
            name: 'MultipleChain.TON'
        }
    }
})
