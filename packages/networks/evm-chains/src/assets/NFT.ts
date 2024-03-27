import { Contract } from './Contract.ts'
import ERC721 from '../../resources/erc721.json'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import type { NftInterface, TransactionSignerInterface } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface {
    /**
     * @returns Contract name
     */
    getName(): string {
        return 'example'
    }

    /**
     * @returns Contract symbol
     */
    getSymbol(): string {
        return 'example'
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of TOKEN or COIN assets
     */
    getBalance(owner: string): number {
        return 0
    }

    /**
     * @returns Contract address
     */
    getAddress(): string {
        return 'example'
    }

    /**
     * @returns NFT ID
     */
    getNftId(): number {
        return 0
    }

    /**
     * @param sender Sender address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    transfer(sender: string, receiver: string, nftId: number): TransactionSignerInterface {
        return new TransactionSigner('example')
    }

    /**
     * @param nftId NFT ID
     * @returns NFT owner wallet address
     */
    getOwner(nftId: number): string {
        return 'example'
    }

    /**
     * @param nftId NFT ID
     * @returns NFT URI
     */
    getTokenURI(nftId: number): string {
        return 'example'
    }
}
