import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { CoinInterface, TransactionSignerInterface } from '@multiplechain/types'
import { Provider } from '../services/Provider.ts'
import { hexToNumber, numberToHex } from '@multiplechain/utils'
import type { TransactionData } from '../services/TransactionSigner.ts'

const { network, ethers } = Provider.instance

export class Coin implements CoinInterface {
    /**
     * @returns Coin name
     */
    getName(): string {
        return network.nativeCurrency.name ?? network.nativeCurrency.symbol
    }

    /**
     * @returns Coin symbol
     */
    getSymbol(): string {
        return network.nativeCurrency.symbol
    }

    /**
     * @returns Decimal value of the coin
     */
    getDecimals(): number {
        return network.nativeCurrency.decimals
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    async getBalance(owner: string): Promise<number> {
        const balance = await ethers.getBalance(owner)
        return hexToNumber(balance.toString(), this.getDecimals())
    }

    /**
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     */
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<TransactionSignerInterface> {
        if (amount < 0) {
            throw new Error('Invalid amount')
        }

        if (amount > (await this.getBalance(sender))) {
            throw new Error('Insufficient balance')
        }

        const hexAmount = numberToHex(amount, this.getDecimals())

        const txData: TransactionData = {
            data: '0x',
            to: receiver,
            from: sender,
            chainId: network.id,
            value: hexAmount
        }

        const [gasPrice, nonce, gas] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(sender),
            ethers.getEstimateGas(txData)
        ])

        txData.gas = gas
        txData.nonce = nonce
        txData.gasPrice = gasPrice
        txData.gasLimit = 21000

        return new TransactionSigner(txData)
    }
}
