import { Contract } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type NftId,
    type NftInterface,
    type WalletAddress
} from '@multiplechain/types'
import { Transaction } from '@mysten/sui/transactions'

interface NftMetadata {
    name: string
    symbol: string
    owner: string | null
    image: string | null
    description: string
}

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    /**
     * Contract metadata
     */
    metadata: NftMetadata | null

    /**
     * @param address NFT address
     * @returns Contract metadata
     */
    async getMetadata(address?: string): Promise<NftMetadata | null> {
        const res = await this.provider.client.getObject({
            id: address ?? this.address,
            options: {
                showContent: true,
                showOwner: true
            }
        })
        if (res?.data?.content?.dataType === 'moveObject') {
            const obj = res.data.content.fields as any
            this.metadata = {
                name: obj.name,
                symbol: obj.symbol ?? obj.name,
                description: obj.description ?? obj.name,
                image: obj.image ?? obj.url ?? obj.image_url ?? null,
                // @ts-expect-error it's possible
                owner: res.data.owner?.ObjectOwner ?? res.data.owner?.AddressOwner ?? null
            }
        }
        return this.metadata
    }

    /**
     * @param address NFT address
     * @returns NFT name
     */
    async getName(address?: string): Promise<string> {
        return (await this.getMetadata(address))?.name ?? ''
    }

    /**
     * @param address NFT address
     * @returns NFT symbol
     */
    async getSymbol(address?: string): Promise<string> {
        return (await this.getMetadata(address))?.symbol ?? ''
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const res = await this.provider.client.getOwnedObjects({
            owner,
            filter: {
                StructType: this.address
            },
            limit: 50
        })
        return res.data.length
    }

    /**
     * @param nftId NFT ID
     * @returns Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        return (await this.getMetadata(String(nftId)))?.owner ?? ''
    }

    /**
     * @param nftId NFT ID
     * @returns URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return (await this.getMetadata(String(nftId)))?.image ?? ''
    }

    /**
     * @param _nftId ID of the NFT that will be transferred
     * @returns Wallet address of the approved spender
     */
    async getApproved(_nftId: NftId): Promise<WalletAddress | null> {
        throw new Error('Method not implemented.')
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
        // Check if tokens exist
        const balance = await this.getBalance(sender)

        if (balance <= 0) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        // Check ownership
        const originalOwner = await this.getOwner(nftId)
        if (originalOwner.toLowerCase() !== sender.toLowerCase()) {
            throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
        }

        const tx = new Transaction()

        tx.transferObjects([tx.object(String(nftId))], receiver)

        return new TransactionSigner(tx)
    }

    /**
     * @param _spender Spender address
     * @param _owner Owner address
     * @param _receiver Receiver address
     * @param _nftId NFT ID
     * @returns Transaction signer
     */
    async transferFrom(
        _spender: WalletAddress,
        _owner: WalletAddress,
        _receiver: WalletAddress,
        _nftId: NftId
    ): Promise<TransactionSigner> {
        throw new Error('Method not implemented.')
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param _owner Address of owner of the tokens that will be used
     * @param _spender Address of the spender that will use the tokens of owner
     * @param _nftId ID of the NFT that will be transferred
     * @returns Transaction signer
     */
    async approve(
        _owner: WalletAddress,
        _spender: WalletAddress,
        _nftId: NftId
    ): Promise<TransactionSigner> {
        throw new Error('Method not implemented.')
    }
}
