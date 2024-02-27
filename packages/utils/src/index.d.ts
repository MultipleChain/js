/// <reference types="node" />
import { toHex } from 'web3-utils';
import BigNumber from 'bignumber.js';
export declare const numberToHex: (value: number | string | BigNumber, decimals: number) => string;
export declare const hexToNumber: (value: string, decimals: number) => number;
export declare const base58Encode: (input: Uint8Array | string) => string;
export declare const base58Decode: (input: string) => Uint8Array;
export declare const bufferToString: (input: Buffer) => string;
export declare const stringToBuffer: (input: string) => Buffer;
export declare const isNumeric: (value: string | number) => boolean;
export { toHex };
