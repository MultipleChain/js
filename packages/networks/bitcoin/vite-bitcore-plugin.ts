import type { Plugin } from 'vite'

/**
 * bitcore-lib's address.js lazy-requires Script at the bottom of the file to break
 * circular dependencies. When Vite/Rollup re-bundles the CJS modules, that assignment
 * may not have run before the first `new Address()` call, leaving Script undefined and
 * causing: "Right-hand side of 'instanceof' is not callable".
 * @returns Vite plugin that patches bitcore-lib's Address module during bundling
 */
export function fixBitcoreAddressCircularDeps(): Plugin {
    return {
        name: 'fix-bitcore-address-circular-deps',
        transform(code, id) {
            if (!id.includes('bitcore-lib') || !id.endsWith('/lib/address.js')) {
                return null
            }

            if (!code.includes('Address.prototype._classifyArguments')) {
                return null
            }

            if (code.includes("var Script = require('./script');\n  /* jshint maxcomplexity")) {
                return null
            }

            return code.replace(
                'Address.prototype._classifyArguments = function(data, network, type) {',
                `Address.prototype._classifyArguments = function(data, network, type) {
  var PublicKey = require('./publickey');
  var Script = require('./script');`
            )
        }
    }
}
