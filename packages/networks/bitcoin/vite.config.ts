import { mergeConfig } from 'vite'
import mainConfig from '../../../vite.config'
import { fixBitcoreAddressCircularDeps } from './vite-bitcore-plugin'

export default mergeConfig(mainConfig, {
    plugins: [fixBitcoreAddressCircularDeps()],
    build: {
        lib: {
            name: 'MultipleChain.Bitcoin'
        }
    }
})
