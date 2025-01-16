import { Contract } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type NftId,
    type NftInterface,
    type WalletAddress
} from '@multiplechain/types'
import axios from 'axios'
import { Address, beginCell, internal, toNano } from '@ton/core'
import { OpCodes } from '../browser'

interface NftMetadata {
    name: string
    image: string
    description: string
}

type Content = Record<string, unknown> & {
    uri: string
}

interface NftItem {
    address: string
    code_hash: string
    collection: {
        address: string
        code_hash: string
        collection_content: Content
        data_hash: string
        last_transaction_lt: string
        next_item_index: string
        owner_address: string
    }
    collection_address: string
    content: Content
    data_hash: string
    index: string
    init: boolean
    last_transaction_lt: string
    owner_address: string
}

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    metadata: NftMetadata

    /**
     * @returns Token metadata
     */
    async getMetadata(): Promise<NftMetadata> {
        if (this.metadata) {
            return this.metadata
        }

        const result = await this.provider.client3.getNftCollections({
            collection_address: [this.address]
        })

        const collectionUri = result.nft_collections[0].collection_content.uri

        const { data } = (await axios.get(collectionUri)) as any

        return (this.metadata = {
            name: data.name,
            image: data.image,
            description: data.description
        })
    }

    /**
     * @param nftId NFT ID
     * @returns NFT item
     */
    async getNftItem(nftId: NftId): Promise<NftItem> {
        const result = await this.provider.client3.getNftItems({
            collection_address: this.address,
            address: [String(nftId)]
        })

        return result.nft_items[0]
    }

    /**
     * @returns NFT name
     */
    async getName(): Promise<string> {
        return (await this.getMetadata()).name
    }

    /**
     * @returns NFT symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.getMetadata()).description
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        const result = await this.provider.client3.getNftItems({
            collection_address: this.address,
            owner_address: [owner]
        })
        return result.nft_items.length
    }

    /**
     * @param nftId NFT ID
     * @returns Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        return Address.parse((await this.getNftItem(nftId)).owner_address).toString(
            this.provider.walletStandard
        )
    }

    /**
     * @param nftId NFT ID
     * @returns URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return (await this.getNftItem(nftId)).content.uri
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
     * @param body Comment for the transaction
     * @returns Transaction signer
     */
    async transfer(
        sender: WalletAddress,
        receiver: WalletAddress,
        nftId: NftId,
        body?: string
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

        const builder = beginCell().storeUint(OpCodes.NFT_TRANSFER, 32).storeUint(0, 64)

        const cell = this.endCell(builder, receiver, sender, body)

        return new TransactionSigner(
            internal({
                to: Address.parse(String(nftId)),
                value: toNano('0.05'),
                bounce: true,
                body: cell
            })
        )
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
