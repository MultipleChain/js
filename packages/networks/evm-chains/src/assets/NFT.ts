import { Contract } from './Contract.ts'
import type { InterfaceAbi } from 'ethers'
import ERC721 from '../../resources/erc721.json'
import type { Provider } from '../services/Provider.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import { ErrorTypeEnum, type NftInterface } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface {
    /**
     * @param {string} address Contract address
     * @param {Provider} provider Blockchain network provider
     * @param {InterfaceAbi} ABI Contract ABI
     */
    constructor(address: string, provider?: Provider, ABI?: InterfaceAbi) {
        super(address, provider, ABI ?? ERC721)
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
     * @param {number} nftId NFT ID
     * @returns {Promise<string>} Wallet address of the owner of the NFT
     */
    async getOwner(nftId: number): Promise<string> {
        return await this.callMethod('ownerOf', nftId)
    }

    /**
     * @param {number} nftId NFT ID
     * @returns {Promise<string>} URI of the NFT
     */
    async getTokenURI(nftId: number): Promise<string> {
        return await this.callMethod('tokenURI', nftId)
    }

    /**
     * @param {number} nftId ID of the NFT that will be transferred
     * @returns {Promise<string>} Wallet address of the approved spender
     */
    async getApproved(nftId: number): Promise<string> {
        return await this.callMethod('getApproved', nftId)
    }

    /**
     * @param {string} sender Sender address
     * @param {string} receiver Receiver address
     * @param {number} nftId NFT ID
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async transfer(sender: string, receiver: string, nftId: number): Promise<TransactionSigner> {
        return await this.transferFrom(sender, sender, receiver, nftId)
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

        // check if spender different from owner
        if (spender !== owner) {
            const approved = await this.getApproved(nftId)
            if (approved !== spender) {
                throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
            }
        }

        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            this.provider.ethers.getGasPrice(),
            this.provider.ethers.getNonce(spender),
            this.getMethodData('transferFrom', owner, receiver, nftId),
            this.getMethodEstimateGas('transferFrom', spender, owner, receiver, nftId)
        ])

        return new TransactionSigner({
            data,
            nonce,
            gasPrice,
            gasLimit,
            value: '0x0',
            from: spender,
            to: this.getAddress(),
            chainId: this.provider.network.id
        })
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param {string} owner Address of owner of the tokens that will be used
     * @param {string} spender Address of the spender that will use the tokens of owner
     * @param {number} nftId ID of the NFT that will be transferred
     * @returns {Promise<TransactionSigner>} Transaction signer
     */
    async approve(owner: string, spender: string, nftId: number): Promise<TransactionSigner> {
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

        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            this.provider.ethers.getGasPrice(),
            this.provider.ethers.getNonce(owner),
            this.getMethodData('approve', spender, nftId),
            this.getMethodEstimateGas('approve', owner, spender, nftId)
        ])

        return new TransactionSigner({
            data,
            nonce,
            gasPrice,
            gasLimit,
            value: '0x0',
            from: owner,
            to: this.getAddress(),
            chainId: this.provider.network.id
        })
    }
}
