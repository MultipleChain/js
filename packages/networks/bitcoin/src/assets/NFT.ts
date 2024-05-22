import { Contract } from './Contract.ts'
import type { NftId, NftInterface, WalletAddress } from '@multiplechain/types'
import { TransactionSigner } from '../services/TransactionSigner.ts'

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    /**
     * @returns {Promise<string>} NFT name
     */
    async getName(): Promise<string> {
        return 'example'
    }

    /**
     * @returns {Promise<string>} NFT symbol
     */
    async getSymbol(): Promise<string> {
        return 'example'
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return 0
    }

    /**
     * @param {NftId} nftId NFT ID
     * @returns {Promise<WalletAddress>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        return 'example'
    }

    /**
     * @param {NftId} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return 'example'
    }

    /**
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<WalletAddress | null>} Wallet address of the approved spender
     */
    async getApproved(nftId: NftId): Promise<WalletAddress | null> {
        return 'example'
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
        // @ts-expect-error just example
        return new TransactionSigner('example')
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
        // @ts-expect-error just example
        return new TransactionSigner('example')
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
        // @ts-expect-error just example
        return new TransactionSigner('example')
    }
}
