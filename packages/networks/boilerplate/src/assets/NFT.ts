import { Contract } from './Contract.ts'
import type { NftInterface } from '@multiplechain/types'
import { NftTransactionSigner } from '../services/TransactionSigner.ts'

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
     * @param {number | string} nftId NFT ID
     * @returns {Promise<string>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: number | string): Promise<string> {
        return 'example'
    }

    /**
     * @param {number | string} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: number | string): Promise<string> {
        return 'example'
    }

    /**
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @returns {Promise<string>} Wallet address of the approved spender
     */
    async getApproved(nftId: number | string): Promise<string> {
        return 'example'
    }

    /**
     * @param {string} sender Sender address
     * @param {string} receiver Receiver address
     * @param {number | string} nftId NFT ID
     * @returns {Promise<NftTransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        nftId: number | string
    ): Promise<NftTransactionSigner> {
        return new NftTransactionSigner('example')
    }

    /**
     * @param {string} spender Spender address
     * @param {string} owner Owner address
     * @param {string} receiver Receiver address
     * @param {number | string} nftId NFT ID
     * @returns {Promise<NftTransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        nftId: number | string
    ): Promise<NftTransactionSigner> {
        return new NftTransactionSigner('example')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(
        owner: string,
        spender: string,
        nftId: number | string
    ): Promise<NftTransactionSigner> {
        return new NftTransactionSigner('example')
    }
}
