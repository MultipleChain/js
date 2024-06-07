import TRC721 from '../../resources/TRC721.json'
import type { Provider } from '../services/Provider'
import { Contract, type InterfaceAbi } from './Contract'
import { TransactionSigner } from '../services/TransactionSigner'
import {
    ErrorTypeEnum,
    type ContractAddress,
    type NftId,
    type NftInterface,
    type WalletAddress
} from '@multiplechain/types'

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    /**
     * @param address Contract address
     * @param provider Blockchain network provider
     * @param ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? TRC721)
    }

    /**
     * @returns NFT name
     */
    async getName(): Promise<string> {
        return (await this.callMethodWithCache('name')) as string
    }

    /**
     * @returns NFT symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.callMethodWithCache('symbol')) as string
    }

    /**
     * @param owner Wallet address
     * @returns Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return Number(await this.callMethod('balanceOf', owner))
    }

    /**
     * @param nftId NFT ID
     * @returns Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        return this.provider.tronWeb.address.fromHex(await this.callMethod('ownerOf', nftId))
    }

    /**
     * @param nftId NFT ID
     * @returns URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return (await this.callMethodWithCache('tokenURI', nftId)) as string
    }

    /**
     * @param nftId ID of the NFT that will be transferred
     * @returns Wallet address of the approved spender
     */
    async getApproved(nftId: NftId): Promise<WalletAddress | null> {
        const address = await this.callMethod('getApproved', nftId)
        if (address !== '410000000000000000000000000000000000000000') {
            return this.provider.tronWeb.address.fromHex(address)
        }
        return null
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
        return await this.transferFrom(sender, sender, receiver, nftId)
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

        const data = await this.createTransactionData(
            'transferFrom',
            spender,
            owner,
            receiver,
            nftId
        )

        data.options.feeLimit = 100000000

        const result = await this.provider.tronWeb.triggerContract(data)

        if (result === false) {
            throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        }

        return new TransactionSigner(result)
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

        const data = await this.createTransactionData('approve', owner, spender, nftId)
        data.options.feeLimit = 100000000

        const result = await this.provider.tronWeb.triggerContract(data)

        if (result === false) {
            throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        }

        return new TransactionSigner(result)
    }
}
