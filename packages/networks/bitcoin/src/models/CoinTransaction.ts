import { fromSatoshi } from '../utils'
import { Transaction, type VoutObject } from './Transaction'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type { WalletAddress, CoinTransactionInterface, TransferAmount } from '@multiplechain/types'

export class CoinTransaction extends Transaction implements CoinTransactionInterface {
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
            .filter((output) => output.scriptpubkey_address?.toLowerCase() === target)
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
        const received = outputs.find(
            (output) => output.scriptpubkey_address?.toLowerCase() !== sender
        )
        return received?.scriptpubkey_address ?? outputs[0]?.scriptpubkey_address ?? ''
    }

    /**
     * @returns Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        return await this.getSigner()
    }

    /**
     * Bitcoin has no protocol-level "transfer amount": a transaction is just
     * inputs -> outputs with no flag marking payment vs. change. So the amount
     * can only be resolved relative to an address.
     * @param address - When given, totals every output paying to that address.
     *                   When omitted, returns the amount that left the sender
     *                   (every output not returning to the sender as change).
     * @returns Amount of coin that was transferred
     */
    async getAmount(address?: WalletAddress): Promise<TransferAmount> {
        const data = await this.getData()
        const outputs = data?.vout ?? []

        if (address !== undefined) {
            return fromSatoshi(this.sumOutputsFor(outputs, address))
        }

        const sender = (await this.getSender()).toLowerCase()
        const outgoing = outputs.filter(
            (output) => output.scriptpubkey_address?.toLowerCase() !== sender
        )
        // Self-transfer (every output returns to the sender): fall back to total.
        const relevant = outgoing.length > 0 ? outgoing : outputs
        return fromSatoshi(relevant.reduce((total, output) => total + output.value, 0))
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
            // Total received by this specific address, regardless of output order.
            if ((await this.getAmount(address)) !== amount) {
                return TransactionStatusEnum.FAILED
            }
        } else {
            if ((await this.getSender()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
            if ((await this.getAmount()) !== amount) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
