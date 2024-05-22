import axios from 'axios'
import { Provider } from '../services/Provider.ts'
import { fromSatoshi, toSatoshi } from '../utils.ts'
import { Transaction, Script, Address } from 'bitcore-lib'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import {
    ErrorTypeEnum,
    type CoinInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'

export class Coin implements CoinInterface<TransactionSigner> {
    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * @param {Provider} provider network provider
     */
    constructor(provider?: Provider) {
        this.provider = provider ?? Provider.instance
    }

    /**
     * @returns {string} Coin name
     */
    getName(): string {
        return 'Bitcoin'
    }

    /**
     * @returns {string} Coin symbol
     */
    getSymbol(): string {
        return 'BTC'
    }

    /**
     * @returns {number} Decimal value of the coin
     */
    getDecimals(): number {
        return 8
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of COIN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const addressStatsApi = this.provider.createEndpoint('address/' + owner)
        const addressStats = await axios.get(addressStatsApi).then((res) => res.data)
        const balanceSat =
            addressStats.chain_stats.funded_txo_sum - addressStats.chain_stats.spent_txo_sum
        return fromSatoshi(balanceSat)
    }

    /**
     * @param {WalletAddress} sender Sender wallet address
     * @param {WalletAddress} receiver Receiver wallet address
     * @param {TransferAmount} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        if (amount > (await this.getBalance(sender))) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        if (sender === receiver) {
            throw new Error(ErrorTypeEnum.INVALID_ADDRESS)
        }

        const inputs = []
        const transaction = new Transaction()
        const senderAddress = new Address(sender)
        const satoshiToSend = toSatoshi(amount)

        const utxos = await axios
            .get(this.provider.createEndpoint('address/' + sender + '/utxo'))
            .then((res) => res.data)

        for (const utxo of utxos) {
            inputs.push(
                new Transaction.UnspentOutput({
                    txId: utxo.txid,
                    satoshis: utxo.value,
                    address: senderAddress,
                    outputIndex: utxo.vout,
                    script: Script.fromAddress(senderAddress)
                })
            )
        }

        transaction.from(inputs)
        transaction.change(sender)
        transaction.to(receiver, satoshiToSend)

        return new TransactionSigner({
            sender,
            receiver,
            amount: satoshiToSend,
            bitcoreLib: transaction
        })
    }
}
