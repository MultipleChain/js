import TRC721 from '../../resources/TRC721.json'
import type { Provider } from '../services/Provider.ts'
import { Contract, type InterfaceAbi } from './Contract.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import {
    ErrorTypeEnum,
    type ContractAddress,
    type NftId,
    type NftInterface,
    type WalletAddress
} from '@multiplechain/types'

export class NFT extends Contract implements NftInterface<TransactionSigner> {
    /**
     * @param {ContractAddress} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: ContractAddress, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? TRC721)
    }

    /**
     * @returns {Promise<string>} NFT name
     */
    async getName(): Promise<string> {
        return (await this.callMethod('name')) as string
    }

    /**
     * @returns {Promise<string>} NFT symbol
     */
    async getSymbol(): Promise<string> {
        return (await this.callMethod('symbol')) as string
    }

    /**
     * @param {WalletAddress} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of NFT
     */
    async getBalance(owner: WalletAddress): Promise<number> {
        return Number(await this.callMethod('balanceOf', owner))
    }

    /**
     * @param {NftId} nftId NFT ID
     * @returns {Promise<WalletAddress>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: NftId): Promise<WalletAddress> {
        return this.provider.tronWeb.address.fromHex(await this.callMethod('ownerOf', nftId))
    }

    /**
     * @param {NftId} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: NftId): Promise<string> {
        return (await this.callMethod('tokenURI', nftId)) as string
    }

    /**
     * @param {NftId} nftId ID of the NFT that will be transferred
     * @returns {Promise<WalletAddress | null>} Wallet address of the approved spender
     */
    async getApproved(nftId: NftId): Promise<WalletAddress | null> {
        const address = await this.callMethod('getApproved', nftId)
        if (address !== '410000000000000000000000000000000000000000') {
            return this.provider.tronWeb.address.fromHex(address)
        }
        return null
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

        const data = await this.createTransactionData('approve', owner, spender, nftId)
        data.options.feeLimit = 100000000

        const result = await this.provider.tronWeb.triggerContract(data)

        if (result === false) {
            throw new Error(ErrorTypeEnum.TRANSACTION_CREATION_FAILED)
        }

        return new TransactionSigner(result)
    }
}
