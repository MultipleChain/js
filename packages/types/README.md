# MultipleChain Types

It is a suite of types defined to provide cross-network standardization in the MultipleChain project.

## Installation

```bash
npm install @multiplechain/types
```

## Usage

You can import all of the types at once:
```typescript
import type * as types from '@multiplechain/types';
```

Or you import the types one by one:
```typescript
import type {
    // Providers
    ProviderInterface,
    NetworkConfigInterface,

    // Models
    TransactionInterface,
    ContractTransactionInterface,
    AssetTransactionInterface,
    CoinTransactionInterface,
    TokenTransactionInterface,
    NftTransactionInterface,

    // Assets
    AssetInterface,
    ContractInterface,
    CoinInterface,
    TokenInterface,
    NftInterface,

    // Enums
    AssetDirectionEnum,
    TransactionTypeEnum,
    TransactionStatusEnum,

    // Transaction Listeners
    TransactionListenerInterface,
    DynamicTransactionType

    // Transaction Signer
    TransactionSignerInterface
} from '@multiplechain/types';
```

## Types
### Provider
#### [ProviderInterface](./packages/types/src/services/ProviderInterface.ts)
`Provider` is the main class that will be used for every network (EVM, Solana, Tron, etc.)

`ProviderInterface` is the interface of `Provider` class.

#### [NetworkConfigInterface](./packages/types/src/services/ProviderInterface.ts)
`update()` and `constructor()` methods of `Provider` class takes a config parameter. Interface of this config parameter is defined as `NetworkConfigInterface`.

### Models
**There are 6 types of transaction models:**
#### [TransactionInterface](./packages/types/src/models.ts)
`TransactionInterface` is the most comprehensive interface compared to others. Every other interface extends `TransactionInterface`.

This interface has ID management of transactions since each transaction and each transaction type has its own unique ID, and also has helper functions that is being used in every other transaction types such as `getBlockNumber` and `getStatus`

#### [ContractTransactionInterface](./packages/types/src/models.ts)
Inherits `TransactionInterface`. Used for smart contracts transactions. Token and NFT transactions inherits `ContractTransactionInterface`.

On top of `TransactionInterface`, lets developers to grab smart contract address used in transaction.

```typescript
getAddress: () => string // Smart contract address of the transaction
```

#### [AssetTransactionInterface](./packages/types/src/models.ts)
Inherits `TransactionInterface`. Used for asset transactions.

#### [CoinTransactionInterface](./packages/types/src/models.ts)
Used for transactions on blockchain done with native currency of the network. In other words, supports transaction data done on Layer-1 networks (Tron, Ethereum, Solana, etc.)

#### [TokenTransactionInterface](./packages/types/src/models.ts)
Used for token transactions. Adds a support for verification of approvement on top of `AssetTransactionInterface`.

#### [NftTransactionInterface](./packages/types/src/models.ts)
Used for NFT transactions. NFT transactions has a pointer property to NFT ID, `NftTransactionInterface` adds a helper method named `getNftId()` to grab that ID.

Also just like `TokenTransactionInterface` there is an approvement verification method in `NftTransactionInterface` too.

### Assets
**There are 5 types of asset interfaces**

#### [AssetInterface](./packages/types/src/assets.ts)
`AssetInterface` is the most comprehensive interface compared to others. Every other interface except `ContractInterface` extends `TransactionInterface`.

It has helper methods like starting a transfer. `transfer()` method is available for every asset type (COINs, TOKENs, NFTs).

#### [ContractInterface](./packages/types/src/assets.ts)
`ContractInterface` is inherited by `TokenInterface` and `NftInterface`. It has helper methods like grabbing contract addresses.

#### [CoinInterface](./packages/types/src/assets.ts)
Used for coin assets. Currently adds a helper method to get decimal value of the asset on top of `AssetInterface`.

#### [TokenInterface](./packages/types/src/assets.ts)
Contains helper methods that can be used for grabbing token data like `getTotalSupply()`.

#### [NftInterface](./packages/types/src/assets.ts)
Contains helper methods for NFT type of assets. Unlike the other asset interfaces, `NftInterface` overrides the `transfer()` method since it needs an `nftId` parameter instead of a `amount` parameter.

### Enums

#### [AssetDirectionEnum](./packages/types/src/enums.ts)
Asset transactions (COIN, TOKEN, NFT) has two directions

```typescript
enum AssetDirectionEnum {
    INCOMING,
    OUTGOING
}
```

#### [TransactionTypeEnum](./packages/types/src/enums.ts)
There are six types of transactions at the moment. COIN, TOKEN, and NFT transactions are called ASSET transactions

```typescript
enum TransactionTypeEnum {
    GENERAL,
    CONTRACT,
    ASSET,
    COIN,
    TOKEN,
    NFT
}
```

#### [TransactionStatusEnum](./packages/types/src/enums.ts)
There are 3 available transaction statuses:
 * FAILED: When a transaction is failed
 * PENDING: When a transaction has not been concluded
 * CONFIRMED: When a transaction is confirmed

```typescript
enum TransactionStatusEnum {
    FAILED,
    PENDING,
    CONFIRMED
}

```

### Transaction Listener

#### [TransactionListenerInterface](./packages/types/src/services/TransactionListenerInterface.ts)
In order to listen to transactions whether they are `PENDING` or `FAILED` for instance, there needs to be a class providing methods for transaction listening.

`TransactionListenerInterface` is the interface of the `TransactionListener` class which supports gathering transaction status, stopping the transaction, and callbacks after a transaction status change.

#### [DynamicTransactionType](./packages/types/src/services/TransactionListenerInterface.ts)
There are different types of transactions, in order to listen correct transaction, correct transaction type needs to be provided. `DynamicTransactionType` is a helper interface that connects transaction types to their corresponding transaction interfaces

```typescript
export type DynamicTransactionType<T extends TransactionTypeEnum> =
    T extends TransactionTypeEnum.GENERAL
        ? TransactionInterface
        : T extends TransactionTypeEnum.CONTRACT
          ? ContractTransactionInterface
          : T extends TransactionTypeEnum.COIN
            ? CoinTransactionInterface
            : T extends TransactionTypeEnum.TOKEN
              ? TokenTransactionInterface
              : T extends TransactionTypeEnum.NFT
                ? NftTransactionInterface
                : never
```

#### [DynamicTransactionListenerFilterType](./packages/types/src/services/TransactionListenerInterface.ts)
`filter` is an object that has values depending on transaction listener type. It has properties such as `sender`, `receiver`, etc.

Just like `DynamicTransactionType`, `DynamicTransactionListenerFilterType` is a helper interface to get correct filter type.

### Transaction Signer
#### [TransactionSignerInterface](./packages/types/src/services/TransactionSignerInterface.ts)

Provides a class to sign and send transactions. `TransactionSignerInterface` has all of the methods to audit a signature.

Methods of `TransactionSignerInterface` are as follows:

Signs the transaction:
```typescript
sign: (privateKey: string) => TransactionSignerInterface
```

Sends the signed transaction:
```typescript
send: () => Promise<TransactionInterface | Error>
```
Returns unsigned transaction data
```typescript
getRawData: () => any
```

Returns signed transaction data
```typescript
getSignedData: () => any
```