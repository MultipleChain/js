import { Contract } from './Contract'
import { math } from '@multiplechain/utils'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type TokenInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { Transaction } from '@mysten/sui/transactions'
import type { CoinMetadata } from '@mysten/sui/client'

export class Token extends Contract implements TokenInterface<TransactionSigner> {
    /**
     * Contract metadata
     */
    metadata: CoinMetadata | null

    /**
     * @returns Contract metadata
     */
    async getMetadata(): Promise<CoinMetadata | null> {
        if (this.metadata) {
            return this.metadata
        }
        return (this.metadata = await this.provider.client.getCoinMetadata({
            coinType: this.address
        }))
    }

    /**
     * @returns Token name
     */
    async getName(): Promise<string> {
        return (await this.getMetadata())?.name ?? ''
    }

    /**
     * @returns Token symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.getMetadata())?.symbol ?? ''
    }

    /**
     * @returns Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return (await this.getMetadata())?.decimals ?? 0
    }

    /**
     * @param amount Amount of tokens that will be transferred
     * @returns Formatted amount
     */
    private async toMist(amount: number | string): Promise<number> {
        const decimals = await this.getDecimals()
        return math.mul(Number(amount), math.pow(10, decimals), decimals)
    }

    /**
     * @param amount Amount of tokens that will be transferred
     * @returns Formatted amount
     */
    private async fromMist(amount: number | string): Promise<number> {
        const decimals = await this.getDecimals()
        return math.div(Number(amount), math.pow(10, decimals), decimals)
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const balance = await this.provider.client.getBalance({
            owner,
            coinType: this.address
        })
        return await this.fromMist(balance.totalBalance)
    }

    /**
     * @returns Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        const supply = await this.provider.client.getTotalSupply({
            coinType: this.address
        })
        return await this.fromMist(supply.value)
    }

    /**
     * @param _owner Address of owner of the tokens that is being used
     * @param _spender Address of the spender that is using the tokens of owner
     * @returns Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(_owner: WalletAddress, _spender: WalletAddress): Promise<number> {
        throw new Error('Method not implemented.')
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        if (amount <= 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(sender)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        amount = await this.toMist(amount)

        const coins = await this.provider.client.getCoins({
            owner: sender,
            coinType: this.address
        })

        const enoughBalanceCoin = coins.data.find((c) => Number(c.balance) >= amount)

        const tx = new Transaction()

        if (enoughBalanceCoin) {
            tx.transferObjects(
                [tx.splitCoins(tx.object(enoughBalanceCoin.coinObjectId), [amount])],
                receiver
            )
        } else {
            const coinObjectIds = coins.data.map((coin) => coin.coinObjectId)
            const primaryCoin = tx.object(coinObjectIds[0])

            if (coinObjectIds.length > 1) {
                tx.mergeCoins(
                    primaryCoin,
                    coinObjectIds.slice(1).map((id) => tx.object(id))
                )
            }

            tx.transferObjects([tx.splitCoins(primaryCoin, [amount])], receiver)
        }

        return new TransactionSigner(tx)
    }

    /**
     * @param _spender Address of the spender of transaction
     * @param _owner Sender wallet address
     * @param _receiver Receiver wallet address
     * @param _amount Amount of tokens that will be transferred
     * @returns Transaction signer
     */
    async transferFrom(
        _spender: WalletAddress,
        _owner: WalletAddress,
        _receiver: WalletAddress,
        _amount: TransferAmount
    ): Promise<TransactionSigner> {
        throw new Error('Method not implemented.')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param _owner Address of owner of the tokens that will be used
     * @param _spender Address of the spender that will use the tokens of owner
     * @param _amount Amount of the tokens that will be used
     * @returns Transaction signer
     */
    async approve(
        _owner: WalletAddress,
        _spender: WalletAddress,
        _amount: TransferAmount
    ): Promise<TransactionSigner> {
        throw new Error('Method not implemented.')
    }
}
