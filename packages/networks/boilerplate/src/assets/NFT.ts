import { Contract } from './Contract.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { NftInterface, TransactionSignerInterface } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface {
    /**
     * @returns Contract name
     */
    async getName(): Promise<string> {
        return 'example'
    }

    /**
     * @returns Contract symbol
     */
    async getSymbol(): Promise<string> {
        return 'example'
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    async getBalance(owner: string): Promise<number> {
        return 0
    }

    /**
     * @param nftId NFT ID
     * @returns NFT owner wallet address
     */
    async getOwner(nftId: number): Promise<string> {
        return 'example'
    }

    /**
     * @param nftId NFT ID
     * @returns NFT URI
     */
    async getTokenURI(nftId: number): Promise<string> {
        return 'example'
    }

    /**
     * @param nftId NFT ID
     * @returns NFT URI
     */
    async getApproved(nftId: number): Promise<string> {
        return 'example'
    }

    /**
     * @param sender Sender address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        nftId: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }

    /**
     * @param spender Spender address
     * @param sender Sender address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
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
     * @param owner Owner of the nft
     * @param spender Approved spender
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    async approve(
        owner: string,
        spender: string,
        nftId: number
    ): Promise<TransactionSignerInterface> {
        return new TransactionSigner('example')
    }
}
