import { toHex } from 'web3-utils';
import BigNumber from 'bignumber.js';
export declare const numberToHex: (value: number | string | BigNumber, decimals: number) => string;
export declare const hexToNumber: (value: string, decimals: number) => number;
export declare const isNumeric: (value: string | number) => boolean;
export { toHex };
