import { fromSatoshi } from '../utils'
import { Transaction, type VoutObject } from './Transaction'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type { WalletAddress, CoinTransactionInterface, TransferAmount } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
    /**
     * Extract the payout address of a single output (vout entry).
     * @param output - A transaction output
     * @returns Payout address, or empty string when absent
     */
    private outputAddress(output: VoutObject | undefined): WalletAddress {
        return output?.scriptpubkey_address ?? ''
    }

    /**
     * Convert a satoshi amount into a coin-denominated transfer amount.
     * @param satoshi - Amount in satoshi
     * @returns Amount denominated in coin
     */
    private satoshiToAmount(satoshi: number): TransferAmount {
        return fromSatoshi(satoshi)
    }

    /**
     * Sum the value (in satoshi) of every output paying to the given address.
     * Bitcoin allows an address to appear in multiple outputs, so we sum
     * instead of picking the first match.
     * @param outputs - Transaction outputs (vout)
     * @param address - Wallet address to total
     * @returns Total value in satoshi
     */
    private sumOutputsFor(outputs: VoutObject[], address: WalletAddress): number {
        const target = address.toLowerCase()
        return outputs
            .filter((output) => this.outputAddress(output).toLowerCase() === target)
            .reduce((total, output) => total + output.value, 0)
    }

    /**
     * @returns Wallet address of the receiver of transaction
     */
    async getReceiver(): Promise<WalletAddress> {
        const data = await this.getData()
        const outputs = data?.vout ?? []
        const sender = (await this.getSender()).toLowerCase()
        // The receiver is the first output that is not change back to the sender.
        for (const output of outputs) {
            if (this.outputAddress(output).toLowerCase() !== sender) {
                return this.outputAddress(output)
            }
        }
        return this.outputAddress(outputs[0])
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        return await this.getSigner()
    }

    /**
     * @param address - Address to total for. When omitted, defaults to the most
     *   likely receiver (first output not returning to the sender). When it
     *   equals the sender, returns the amount sent out of the wallet; otherwise
     *   the total paid to that address.
     * @returns Amount of coin that was transferred
     */
    async getAmount(address?: WalletAddress): Promise<TransferAmount> {
        const data = await this.getData()
        const outputs = data?.vout ?? []
        const sender = (await this.getSender()).toLowerCase()

        const target = (address ?? (await this.getReceiver())).toLowerCase()

        // Amount sent by the wallet: everything that did not return as change.
        if (target === sender) {
            const outgoing = outputs.filter(
                (output) => this.outputAddress(output).toLowerCase() !== sender
            )
            // Self-transfer (everything returns to the sender): fall back to total.
            const relevant = outgoing.length > 0 ? outgoing : outputs
            const total = relevant.reduce((sum, output) => sum + output.value, 0)
            return this.satoshiToAmount(total)
        }

        // Total paid to this specific address (summed across all its outputs).
        return this.satoshiToAmount(this.sumOutputsFor(outputs, target))
    }

    /**
     * @param direction - Direction of the transaction (asset)
     * @param address - Wallet address of the receiver or sender of the transaction, dependant on direction
     * @param amount Amount of assets that will be transferred
     * @returns Status of the transaction
     */
    async verifyTransfer(
        direction: AssetDirectionEnum,
        address: WalletAddress,
        amount: TransferAmount
    ): Promise<TransactionStatusEnum> {
        const status = await this.getStatus()

        if (status === TransactionStatusEnum.PENDING) {
            return TransactionStatusEnum.PENDING
        }

        if (direction === AssetDirectionEnum.INCOMING) {
            // A single tx (e.g. an exchange batch withdrawal) can pay many
            // addresses at once, so there is no single "receiver" to pick.
            // Verify how much $address actually received, wherever it sits
            // among the outputs. (For the sender this is only its change, which
            // is why verifying an incoming transfer to the sender fails.)
            const data = await this.getData()
            const outputs = data?.vout ?? []
            const received = this.satoshiToAmount(this.sumOutputsFor(outputs, address))
            if (received !== amount) {
                return TransactionStatusEnum.FAILED
            }
        } else {
            if ((await this.getSender()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
            // Amount the wallet sent out (getAmount treats the sender specially).
            if ((await this.getAmount(address)) !== amount) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
