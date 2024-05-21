import { Contract } from './Contract.ts'
import { math } from '@multiplechain/utils'
import { Metaplex } from '@metaplex-foundation/js'
import { ErrorTypeEnum, type TokenInterface } from '@multiplechain/types'
import { TokenTransactionSigner } from '../services/TransactionSigner.ts'
import {
    PublicKey,
    Transaction,
    type AccountInfo,
    type ParsedAccountData,
    type RpcResponseAndContext
} from '@solana/web3.js'
import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    getTokenMetadata,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createApproveInstruction
} from '@solana/spl-token'

interface Metadata {
    name: string
    symbol: string
    programId: string
    decimals: number
}

export class Token extends Contract implements TokenInterface {
    metadata: Metadata

    /**
     * Token metadata
     */
    async getMetadata(): Promise<Metadata | null> {
        if (this.metadata !== undefined) return this.metadata

        const accountInfo = (await this.provider.web3.getParsedAccountInfo(
            this.pubKey
        )) as unknown as RpcResponseAndContext<AccountInfo<ParsedAccountData>>

        if (accountInfo?.value === null) return null

        const programId = accountInfo.value.owner

        if (TOKEN_2022_PROGRAM_ID.equals(programId)) {
            const result = await getTokenMetadata(
                this.provider.web3,
                this.pubKey,
                'confirmed',
                programId
            )
            if (result === null) return null
            return (this.metadata = {
                name: result.name,
                symbol: result.symbol,
                programId: programId.toBase58(),
                decimals: accountInfo.value.data.parsed.info.decimals
            })
        } else {
            const metaplex = Metaplex.make(this.provider.web3)
            const data = await metaplex.nfts().findByMint({ mintAddress: this.pubKey })
            return (this.metadata = {
                name: data.name,
                symbol: data.symbol,
                programId: programId.toBase58(),
                decimals: accountInfo.value.data.parsed.info.decimals
            })
        }
    }

    async getProgramId(): Promise<PublicKey> {
        const accountInfo = await this.provider.web3.getAccountInfo(this.pubKey)
        return accountInfo !== null ? accountInfo.owner : TOKEN_PROGRAM_ID
    }

    /**
     * @returns {Promise<string>} Token name
     */
    async getName(): Promise<string> {
        await this.getMetadata()
        return this.metadata.name
    }

    /**
     * @returns {Promise<string>} Token symbol
     */
    async getSymbol(): Promise<string> {
        await this.getMetadata()
        return this.metadata.symbol
    }

    /**
     * @returns {Promise<number>} Decimal value of the token
     */
    async getDecimals(): Promise<number> {
        await this.getMetadata()
        return this.metadata.decimals
    }

    /**
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of TOKEN
     */
    async getBalance(owner: string): Promise<number> {
        try {
            const res = await this.provider.web3.getParsedTokenAccountsByOwner(
                new PublicKey(owner),
                {
                    mint: this.pubKey
                }
            )

            return res.value[0] === undefined
                ? 0
                : res.value[0].account.data.parsed.info.tokenAmount.uiAmount
        } catch (error) {
            return 0
        }
    }

    /**
     * @returns {Promise<number>} Total supply of the token
     */
    async getTotalSupply(): Promise<number> {
        return (await this.provider.web3.getTokenSupply(this.pubKey)).value.uiAmount ?? 0
    }

    /**
     * @param {string} owner Address of owner of the tokens that is being used
     * @param {string} spender Address of the spender that is using the tokens of owner
     * @returns {Promise<number>} Amount of tokens that the spender is allowed to spend
     */
    async getAllowance(owner: string, spender?: string): Promise<number> {
        try {
            const ownerResult = await this.provider.web3.getParsedTokenAccountsByOwner(
                new PublicKey(owner),
                {
                    mint: this.pubKey
                }
            )

            if (ownerResult.value[0] === undefined) return 0

            if (ownerResult.value[0].account.data.parsed.info.delegatedAmount === undefined)
                return 0

            if (spender !== undefined) {
                if (
                    ownerResult.value[0].account.data.parsed.info.delegate.toLowerCase() !==
                    spender.toLowerCase()
                )
                    return 0
            }

            return ownerResult.value[0].account.data.parsed.info.delegatedAmount.uiAmount
        } catch (error) {
            return 0
        }
    }

    /**
     * @param {number} amount Amount of tokens that will be transferred
     * @returns {Promise<number>} Formatted amount
     */
    private async formatAmount(amount: number): Promise<number> {
        const decimals = await this.getDecimals()
        return math.mul(amount, math.pow(10, decimals), decimals)
    }

    /**
     * transfer() method is the main method for processing transfers for fungible assets (TOKEN, COIN)
     * @param {string} sender Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of assets that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        amount: number
    ): Promise<TokenTransactionSigner> {
        return await this.transferFrom(sender, sender, receiver, amount)
    }

    /**
     * @param {string} spender Address of the spender of transaction
     * @param {string} owner Sender wallet address
     * @param {string} receiver Receiver wallet address
     * @param {number} amount Amount of tokens that will be transferred
     * @returns {Promise<TokenTransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        amount: number
    ): Promise<TokenTransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(owner)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        // check if spender different from owner
        if (spender !== owner) {
            const allowance = await this.getAllowance(owner, spender)

            if (allowance === 0) {
                throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
            }

            if (amount > allowance) {
                throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
            }
        }

        const transaction = new Transaction()
        const ownerPubKey = new PublicKey(owner)
        const spenderPubKey = new PublicKey(spender)
        const receiverPubKey = new PublicKey(receiver)
        const programId = await this.getProgramId()
        const transferAmount = await this.formatAmount(amount)

        const ownerAccount = getAssociatedTokenAddressSync(
            this.pubKey,
            ownerPubKey,
            false,
            programId
        )

        const receiverAccount = getAssociatedTokenAddressSync(
            this.pubKey,
            receiverPubKey,
            false,
            programId
        )

        // If the receiver does not have an associated token account, create one
        if ((await this.provider.web3.getAccountInfo(receiverAccount)) === null) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    spenderPubKey,
                    receiverAccount,
                    receiverPubKey,
                    this.pubKey,
                    programId,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            )
        }

        transaction.add(
            createTransferInstruction(
                ownerAccount,
                receiverAccount,
                spenderPubKey,
                transferAmount,
                [],
                programId
            )
        )

        transaction.feePayer = spenderPubKey

        return new TokenTransactionSigner(transaction)
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number} amount Amount of the tokens that will be used
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(owner: string, spender: string, amount: number): Promise<TokenTransactionSigner> {
        if (amount < 0) {
            throw new Error(ErrorTypeEnum.INVALID_AMOUNT)
        }

        const balance = await this.getBalance(owner)

        if (amount > balance) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        const transaction = new Transaction()
        const ownerPubKey = new PublicKey(owner)
        const spenderPubKey = new PublicKey(spender)
        const programId = await this.getProgramId()
        const approveAmount = await this.formatAmount(amount)

        const ownerAccount = getAssociatedTokenAddressSync(
            this.pubKey,
            ownerPubKey,
            false,
            programId
        )

        transaction.add(
            createApproveInstruction(
                ownerAccount,
                spenderPubKey,
                ownerPubKey,
                approveAmount,
                [],
                programId
            )
        )

        transaction.feePayer = ownerPubKey

        return new TokenTransactionSigner(transaction)
    }
}
