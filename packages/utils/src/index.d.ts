/// <reference types="node" />
declare module "src/index" {
    import { toHex } from 'web3-utils';
    import BigNumber from 'bignumber.js';
    /**
     * Converts the decimal to hexadecimal
     */
    export const numberToHex: (value: number | string | BigNumber, decimals: number) => string;
    /**
     * Converts the hexadecimal to decimal
     */
    export const hexToNumber: (value: string, decimals: number) => number;
    /**
     * Converts the given data to Base58 string. Given data may be string or an Uint8Array
     * If the given data is a string, it'll be converted to Uint8Array inside of the method
     */
    export const base58Encode: (input: Uint8Array | string) => string;
    /**
     * Converts the given string to Base58 as an Uint8Array
     */
    export const base58Decode: (input: string) => Uint8Array;
    /**
     * Converts the given buffer to a string
     */
    export const bufferToString: (input: Buffer) => string;
    /**
     * Converts the given string to a buffer
     */
    export const stringToBuffer: (input: string) => Buffer;
    /**
     * Checks if given value is numeric
     */
    export const isNumeric: (value: string | number) => boolean;
    export { toHex };
}
declare module "tests/index.spec" { }
