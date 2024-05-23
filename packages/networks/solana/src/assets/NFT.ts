import { Contract } from './Contract.ts'
import { Metaplex } from '@metaplex-foundation/js'
import {
    ErrorTypeEnum,
    type NftId,
    type NftInterface,
    type WalletAddress
} from '@multiplechain/types'
import type { Sft, SftWithToken, Nft, NftWithToken } from '@metaplex-foundation/js'
import {
    PublicKey,
    Transaction,
    type AccountInfo,
    type ParsedAccountData,
    type RpcResponseAndContext
} from '@solana/web3.js'
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createApproveInstruction
} from '@solana/spl-token'
import { TransactionSigner } from '../services/TransactionSigner.ts'

type Metadata = Sft | SftWithToken | Nft | NftWithToken

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    metadata: Metadata

    /**
     * @param {PublicKey} pubKey
     * @returns {Promise<Metadata | null>} Metadata of the NFT
     */
    async getMetadata(pubKey?: PublicKey): Promise<Metadata | null> {
        try {
            // if metadata is already fetched and pubKey is not provided, return the metadata
            if (this.metadata !== undefined && pubKey === undefined) {
                return this.metadata
            }
            const metaplex = Metaplex.make(this.provider.web3)
            return (this.metadata = await metaplex.nfts().findByMint({
                mintAddress: pubKey ?? this.pubKey
            }))
        } catch (error) {
            return null
        }
    }

    /**
     * @param {PublicKey} pubKey Program ID
     * @returns {Promise<PublicKey>} Program ID
     * @throws {Error} If the program ID is not found
     */
    async getProgramId(pubKey: PublicKey): Promise<PublicKey> {
        const accountInfo = await this.provider.web3.getAccountInfo(pubKey)
        return accountInfo !== null ? accountInfo.owner : TOKEN_PROGRAM_ID
    }

    /**
     * @returns {Promise<string>} NFT name
     */
    async getName(): Promise<string> {
        return (await this.getMetadata())?.name ?? ''
    }

    /**
     * @returns {Promise<string>} NFT symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.getMetadata())?.symbol ?? ''
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const metaplex = Metaplex.make(this.provider.web3)
        const res = await metaplex.nfts().findAllByOwner({ owner: new PublicKey(owner) })
        return res.filter((nft) => {
            if (nft.collection?.address === undefined) return false
            return this.pubKey.equals(nft.collection?.address)
        }).length
    }

    /**
     * @param {NftId} nftId NFT ID
     * @returns {Promise<WalletAddress>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        const accounts = await this.provider.web3.getTokenLargestAccounts(new PublicKey(nftId))
        const accountInfo = (await this.provider.web3.getParsedAccountInfo(
            accounts.value[0].address
        )) as unknown as RpcResponseAndContext<AccountInfo<ParsedAccountData>>
        return accountInfo.value.data.parsed.info.owner
    }

    /**
     * @param {NftId} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return (await this.getMetadata(new PublicKey(nftId)))?.uri ?? ''
    }

    /**
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<WalletAddress | null>} Wallet address of the approved spender
     */
    async getApproved(nftId: NftId): Promise<WalletAddress | null> {
        const accounts = await this.provider.web3.getTokenLargestAccounts(new PublicKey(nftId))
        const accountInfo = (await this.provider.web3.getParsedAccountInfo(
            accounts.value[0].address
        )) as unknown as RpcResponseAndContext<AccountInfo<ParsedAccountData>>
        return accountInfo.value.data.parsed.info.delegate ?? null
    }

    /**
     * @param {WalletAddress} sender Sender address
     * @param {WalletAddress} receiver Receiver address
     * @param {NftId} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId
    ): Promise<TransactionSigner> {
        return await this.transferFrom(sender, sender, receiver, nftId)
    }

    /**
     * @param {WalletAddress} spender Spender address
     * @param {WalletAddress} owner Owner address
     * @param {WalletAddress} receiver Receiver address
     * @param {NftId} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: WalletAddress,
        owner: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId
    ): Promise<TransactionSigner> {
        // Check if tokens exist
        const balance = await this.getBalance(owner)

        if (balance <= 0) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        // Check ownership
        const originalOwner = await this.getOwner(nftId)
        if (originalOwner !== owner) {
            throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
        }

        // check if spender different from owner
        if (spender !== owner) {
            const approved = await this.getApproved(nftId)
            if (approved !== spender) {
                throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
            }
        }

        const nftPubKey = new PublicKey(nftId)
        const transaction = new Transaction()
        const ownerPubKey = new PublicKey(owner)
        const spenderPubKey = new PublicKey(spender)
        const receiverPubKey = new PublicKey(receiver)
        const programId = await this.getProgramId(nftPubKey)

        const ownerAccount = getAssociatedTokenAddressSync(nftPubKey, ownerPubKey, false, programId)

        const receiverAccount = getAssociatedTokenAddressSync(
            nftPubKey,
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
                    nftPubKey,
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
                1,
                [],
                programId
            )
        )

        transaction.feePayer = spenderPubKey

        return new TransactionSigner(transaction)
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {WalletAddress} owner Address of owner of the tokens that will be used
     * @param {WalletAddress} spender Address of the spender that will use the tokens of owner
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(
        owner: WalletAddress,
        spender: WalletAddress,
        nftId: NftId
    ): Promise<TransactionSigner> {
        // Check if tokens exist
        const balance = await this.getBalance(owner)

        if (balance <= 0) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        // Check ownership
        const originalOwner = await this.getOwner(nftId)
        if (originalOwner !== owner) {
            throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
        }

        const transaction = new Transaction()
        const nftPubKey = new PublicKey(nftId)
        const ownerPubKey = new PublicKey(owner)
        const spenderPubKey = new PublicKey(spender)
        const programId = await this.getProgramId(nftPubKey)

        const ownerAccount = getAssociatedTokenAddressSync(nftPubKey, ownerPubKey, false, programId)

        transaction.add(
            createApproveInstruction(ownerAccount, spenderPubKey, ownerPubKey, 1, [], programId)
        )

        transaction.feePayer = ownerPubKey

        return new TransactionSigner(transaction)
    }
}
