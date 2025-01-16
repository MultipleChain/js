import { Contract } from './Contract'
import { math } from '@multiplechain/utils'
import { Address, beginCell, internal, toNano } from '@ton/core'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type TokenInterface,
    type TransferAmount,
    type WalletAddress
} from '@multiplechain/types'
import { OpCodes } from '../browser'

interface TokenMetadata {
    name: string
    symbol: string
    decimals: number
    description: string
    image: string
}

export class Token extends Contract implements TokenInterface<TransactionSigner> {
    metadata: TokenMetadata

    /**
     * @returns Token metadata
     */
    async getMetadata(): Promise<TokenMetadata> {
        if (this.metadata) {
            return this.metadata
        }

        const master = await this.getJettonMaster()

        return (this.metadata = master.jetton_content as any as TokenMetadata)
    }

    /**
     * @returns Token name
     */
    async getName(): Promise<string> {
        return (await this.getMetadata()).name
    }

    /**
     * @returns Token symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.getMetadata()).symbol
    }

    /**
     * @returns Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        return Number((await this.getMetadata()).decimals)
    }

    /**
     * @param address Wallet address
     * @returns Wallet address of the jetton
     */
    async getJettonWalletAddress(address: string): Promise<Address> {
        const userAddressCell = beginCell().storeAddress(Address.parse(address)).endCell()

        const response = await this.provider.client1.runMethod(
            Address.parse(this.getAddress()),
            'get_wallet_address',
            [{ type: 'slice', cell: userAddressCell }]
        )

        return response.stack.readAddress()
    }

    async getJettonMaster(): Promise<{
        address: string
        admin_address: string
        code_hash: string
        data_hash: string
        jetton_content: Record<string, unknown>
        jetton_wallet_code_hash: string
        last_transaction_lt: string
        mintable: boolean
        total_supply: string
    }> {
        const response = await this.provider.client3.getJettonMasters({
            address: [this.getAddress()]
        })
        return response.jetton_masters[0]
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const response = await this.provider.client3.getJettonWallets({
            owner_address: [owner],
            jetton_address: this.getAddress()
        })
        const decimals = await this.getDecimals()
        const balance = Number(response.jetton_wallets[0].balance)
        return math.div(balance, math.pow(10, decimals), decimals)
    }

    /**
     * @returns Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        const master = await this.getJettonMaster()
        const decimals = await this.getDecimals()
        const totalSupply = Number(master.total_supply)
        return math.div(totalSupply, math.pow(10, decimals), decimals)
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
     * @param amount Amount of tokens that will be transferred
     * @returns Formatted amount
     */
    async formatAmount(amount: number): Promise<number> {
        const decimals = await this.getDecimals()
        return math.mul(amount, math.pow(10, decimals), decimals)
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param sender Sender wallet address
     * @param receiver Receiver wallet address
     * @param amount Amount of assets that will be transferred
     * @param body Comment for the transaction
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        amount: TransferAmount,
        body?: string
    ): Promise<TransactionSigner> {
        if (amount <= 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(sender)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const [formattedAmount, senderJettonWallet] = await Promise.all([
            this.formatAmount(amount),
            this.getJettonWalletAddress(sender)
        ])

        const builder = beginCell()
            .storeUint(OpCodes.JETTON_TRANSFER, 32)
            .storeUint(0, 64)
            .storeCoins(formattedAmount)

        const cell = this.endCell(builder, receiver, sender, body)

        return new TransactionSigner(
            internal({
                to: senderJettonWallet,
                value: toNano('0.05'),
                bounce: true,
                body: cell
            })
        )
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
