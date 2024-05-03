import TRC721 from '../../resources/TRC721.json'
import type { Provider } from '../services/Provider.ts'
import { Contract, type InterfaceAbi } from './Contract.ts'
import { NftTransactionSigner } from '../services/TransactionSigner.ts'
import { ErrorTypeEnum, type NftInterface } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface {
    /**
     * @param {string} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: string, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? TRC721)
    }

    /**
     * @returns {Promise<string>} NFT name
     */
    async getName(): Promise<string> {
        return await this.callMethod('name')
    }

    /**
     * @returns {Promise<string>} NFT symbol
     */
    async getSymbol(): Promise<string> {
        return await this.callMethod('symbol')
    }

    /**
     * @param {string} owner Wallet address
     * @returns {Promise<number>} Wallet balance as currency of NFT
     */
    async getBalance(owner: string): Promise<number> {
        return Number(await this.callMethod('balanceOf', owner))
    }

    /**
     * @param {number | string} nftId NFT ID
     * @returns {Promise<string>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: number | string): Promise<string> {
        return this.provider.tronWeb.address.fromHex(await this.callMethod('ownerOf', nftId))
    }

    /**
     * @param {number | string} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: number | string): Promise<string> {
        return await this.callMethod('tokenURI', nftId)
    }

    /**
     * @param {number | string} nftId ID of the NFT that will be transferred
     * @returns {Promise<string | null>} Wallet address of the approved spender
     */
    async getApproved(nftId: number | string): Promise<string | null> {
        const address = await this.callMethod('getApproved', nftId)
        if (address !== '410000000000000000000000000000000000000000') {
            return this.provider.tronWeb.address.fromHex(address)
        }
        return null
    }

    /**
     * @param {string} sender Sender address
     * @param {string} receiver Receiver address
     * @param {number | string} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(
        sender: string,
        receiver: string,
        nftId: number | string
    ): Promise<NftTransactionSigner> {
        return await this.transferFrom(sender, sender, receiver, nftId)
    }

    /**
     * @param {string} spender Spender address
     * @param {string} owner Owner address
     * @param {string} receiver Receiver address
     * @param {number | string} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transferFrom(
        spender: string,
        owner: string,
        receiver: string,
        nftId: number | string
    ): Promise<NftTransactionSigner> {
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

        return new NftTransactionSigner(result)
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

        return new NftTransactionSigner(result)
    }
}
