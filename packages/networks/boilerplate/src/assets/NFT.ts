import { Contract } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import type { NftId, NftInterface, WalletAddress } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    /**
     * @returns NFT name
     */
    async getName(): Promise<string> {
        return 'example'
    }

    /**
     * @returns NFT symbol
     */
    async getSymbol(): Promise<string> {
        return 'example'
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return 0
    }

    /**
     * @param nftId NFT ID
     * @returns Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @param nftId NFT ID
     * @returns URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return 'example'
    }

    /**
     * @param nftId ID of the NFT that will be transferred
     * @returns Wallet address of the approved spender
     */
    async getApproved(nftId: NftId): Promise<WalletAddress | null> {
        return 'example'
    }

    /**
     * @param sender Sender address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }

    /**
     * @param spender Spender address
     * @param owner Owner address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    async transferFrom(
        spender: WalletAddress,
        owner: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param nftId ID of the NFT that will be transferred
     * @returns Transaction signer
     */
    async approve(
        owner: WalletAddress,
        spender: WalletAddress,
        nftId: NftId
    ): Promise<TransactionSigner> {
        return new TransactionSigner('example')
    }
}
