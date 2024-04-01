import allNetworks, * as methods from './services/Networks.ts'

export * from './services/Provider.ts'

export * as assets from './assets/index.ts'
export * as models from './models/index.ts'
export * as services from './services/index.ts'

export * as utils from '@multiplechain/utils'
export * as types from '@multiplechain/types'

export const networks = {
    ...methods,
    ...allNetworks
}
