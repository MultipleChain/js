# MultipleChain Utils

This package contains a set of utilities that are used across the MultipleChain packages.

## Installation

```bash
npm install @multiplechain/utils
```

## Usage

```javascript
import * as utils from '@multiplechain/utils';
// or
import { toHex, numberToHex, hexToNumber } from '@multiplechain/utils';

const hex = utils.toHex(100); // 0x64
const number = hexToNumber(hex); // 100
```
