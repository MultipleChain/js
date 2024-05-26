import { Token } from '../assets/Token'
import type { InterfaceAbi } from 'ethers'
import ERC20 from '../../resources/ERC20.json'
import { hexToNumber } from '@multiplechain/utils'
import type { Provider } from '../services/Provider'
import { ContractTransaction } from './ContractTransaction'
import { TransactionStatusEnum, AssetDirectionEnum } from '@multiplechain/types'
import type {
    TransactionId,
    TokenTransactionInterface,
    WalletAddress,
    TransferAmount
} from '@multiplechain/types'

export class TokenTransaction extends ContractTransaction implements TokenTransactionInterface {
    /**
     * @param {TransactionId} id Transaction id
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(id: TransactionId, provider?: Provider, ABI?: InterfaceAbi) {
        super(id, provider, ABI ?? (ERC20 as InterfaceAbi))
    }

    /**
     * @return {Promise<WalletAddress>} Receiver wallet address
     */
    async getReceiver(): Promise<WalletAddress> {
        const decoded = await this.decodeData()

        if (decoded === null) {
            return ''
        }

        if (decoded.name === 'transferFrom') {
            return decoded.args[1]
        }

        return decoded.args[0]
    }

    /**
     * @returns {Promise<WalletAddress>} Wallet address of the sender of transaction
     */
    async getSender(): Promise<WalletAddress> {
        const decoded = await this.decodeData()

        if (decoded === null) {
            return ''
        }

        if (decoded.name === 'transferFrom') {
            return decoded.args[0]
        }

        return await this.getSigner()
    }

    /**
     * @returns {Promise<TransferAmount>} Amount of tokens that will be transferred
     */
    async getAmount(): Promise<TransferAmount> {
        const token = new Token(await this.getAddress())
        const decoded = await this.decodeData()
        if (decoded === null) {
            return 0
        }

        if (decoded.name === 'transferFrom') {
            return hexToNumber((decoded.args[2] as bigint).toString(), await token.getDecimals())
        }

        return hexToNumber((decoded.args[1] as bigint).toString(), await token.getDecimals())
    }

    /**
     * @param {AssetDirectionEnum} direction - Direction of the transaction (token)
     * @param {WalletAddress} address - Wallet address of the owner or spender of the transaction, dependant on direction
     * @param {TransferAmount} amount Amount of tokens that will be approved
     * @returns {Promise<TransactionStatusEnum>} Status of the transaction
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

        if ((await this.getAmount()) !== amount) {
            return TransactionStatusEnum.FAILED
        }

        if (direction === AssetDirectionEnum.INCOMING) {
            if ((await this.getReceiver()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        } else {
            if ((await this.getSender()).toLowerCase() !== address.toLowerCase()) {
                return TransactionStatusEnum.FAILED
            }
        }

        return TransactionStatusEnum.CONFIRMED
    }
}
