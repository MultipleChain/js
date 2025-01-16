import lodash from 'lodash'
import bitcore from 'bitcore-lib'

export * from './services/Provider'

export * as bitcore from 'bitcore-lib'

export * as assets from './assets/index'
export * as models from './models/index'
export * as services from './services/index'

export * as utils from './utils'
export * as types from '@multiplechain/types'

declare module 'bitcore-lib' {
    interface Address {
        _classifyArguments: (data: any, network: any, type: any) => any
    }
}

bitcore.Address.prototype._classifyArguments = function (data: any, network: any, type: any) {
    /* jshint maxcomplexity: 10 */
    // transform and validate input data
    if (
        (data instanceof Buffer || data instanceof Uint8Array) &&
        (data.length === 20 || data.length === 32)
    ) {
        // @ts-expect-error exists
        return Address._transformHash(data, network, type)
    } else if ((data instanceof Buffer || data instanceof Uint8Array) && data.length >= 21) {
        // @ts-expect-error exists
        return Address._transformBuffer(data, network, type)
    } else if (data instanceof bitcore.PublicKey) {
        // @ts-expect-error exists
        return Address._transformPublicKey(data, network, type)
    } else if (data instanceof bitcore.Script) {
        // @ts-expect-error exists
        return Address._transformScript(data, network)
    } else if (typeof data === 'string') {
        // @ts-expect-error exists
        return Address._transformString(data, network, type)
    } else if (lodash.isObject(data)) {
        // @ts-expect-error exists
        return Address._transformObject(data)
    } else {
        throw new TypeError('First argument is an unrecognized data format.')
    }
}
