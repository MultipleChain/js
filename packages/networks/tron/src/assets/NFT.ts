import { Contract } from './Contract.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { NftInterface, TransactionSignerInterface } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface {
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
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of NFT
     */
    async getBalance(owner: string): Promise<number> {
        return 0
    }

    /**
     * @param {number} nftId NFT ID
     * @returns {Promise<string>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: number): Promise<string> {
        return 'example'
    }

    /**
     * @param {number} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: number): Promise<string> {
        return 'example'
    }

    /**
     * @param {number} nftId ID of the NFT that will be transferred
     * @returns {Promise<string>} Wallet address of the approved spender
     */
    async getApproved(nftId: number): Promise<string> {
        return 'example'
    }

    /**
     * @param {string} sender Sender address
     * @param {string} receiver Receiver address
     * @param {number} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        nftId: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }

    /**
     * @param {string} spender Spender address
     * @param {string} owner Owner address
     * @param {string} receiver Receiver address
     * @param {number} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        nftId: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(
        owner: string,
        spender: string,
        nftId: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }
}
