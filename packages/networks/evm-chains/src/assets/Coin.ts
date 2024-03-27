import { Provider } from '../services/Provider.ts'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { TransactionData } from '../services/TransactionSigner.ts'
import type { CoinInterface } from '@multiplechain/types'

export class Coin implements CoinInterface {
    /**
     * @returns Coin name
     */
    getName(): string {
        return (
            Provider.instance.network.nativeCurrency.name ??
            Provider.instance.network.nativeCurrency.symbol
        )
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return Provider.instance.network.nativeCurrency.symbol
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return Provider.instance.network.nativeCurrency.decimals
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    async getBalance(owner: string): Promise<number> {
        const balance = await Provider.instance.ethers.getBalance(owner)
        return hexToNumber(balance.toString(), this.getDecimals())
    }

    /**
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    async transfer(sender: string, receiver: string, amount: number): Promise<TransactionSigner> {
        if (amount < 0) {
            throw new Error('Invalid amount')
        }

        if (amount > (await this.getBalance(sender))) {
            throw new Error('Insufficient balance')
        }

        const { network, ethers } = Provider.instance
        const hexAmount = numberToHex(amount, this.getDecimals())

        const txData: TransactionData = {
            data: '0x',
            to: receiver,
            from: sender,
            chainId: network.id,
            value: hexAmount
        }

        const [gasPrice, nonce, gasLimit] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(sender),
            ethers.getEstimateGas(txData)
        ])

        txData.nonce = nonce
        txData.gasPrice = gasPrice
        txData.gasLimit = gasLimit

        return new TransactionSigner(txData)
    }
}
