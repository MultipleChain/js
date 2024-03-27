import { Contract } from './Contract.ts'
import ERC721 from '../../resources/erc721.json'
import { Provider } from '../services/Provider.ts'
import { TransactionSigner } from '../services/TransactionSigner.ts'
import { ErrorTypeEnum, type NftInterface } from '@multiplechain/types'

export class NFT extends Contract implements NftInterface {
    constructor(address: string) {
        super(address, ERC721)
    }

    /**
     * @returns Contract name
     */
    async getName(): Promise<string> {
        return await this.callMethod('name')
    }

    /**
     * @returns Contract symbol
     */
    async getSymbol(): Promise<string> {
        return await this.callMethod('symbol')
    }

    /**
     * @param owner Wallet address
     * @returns Number of tokens of owner
     */
    async getBalance(owner: string): Promise<number> {
        return await this.ethersContract.balanceOf(owner)
    }

    /**
     * @param sender Sender address
     * @param receiver Receiver address
     * @param nftId NFT ID
     * @returns Transaction signer
     */
    async transfer(sender: string, receiver: string, nftId: number): Promise<TransactionSigner> {
        // Check if tokens exist
        const balance = await this.getBalance(sender)

        if (balance <= 0) {
            throw new Error(ErrorTypeEnum.INSUFFICIENT_BALANCE)
        }

        // Check ownership
        const originalOwner = await this.getOwner(nftId)
        if (originalOwner !== sender) {
            throw new Error(ErrorTypeEnum.UNAUTHORIZED_ADDRESS)
        }

        const { network, ethers } = Provider.instance

        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(sender),
            this.getMethodData('transfer', receiver, nftId),
            this.getMethodEstimateGas('transfer', sender, receiver, nftId)
        ])

        return new TransactionSigner({
            data,
            nonce,
            gasPrice,
            gasLimit,
            value: '0x0',
            from: sender,
            chainId: network.id,
            to: receiver
        })
    }

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

        //
    }

    /**
     * @param nftId NFT ID
     * @returns NFT owner wallet address
     */
    async getOwner(nftId: number): Promise<string> {
        return await this.ethersContract.ownerOf(nftId)
    }

    /**
     * @param nftId NFT ID
     * @returns NFT URI
     */
    async getTokenURI(nftId: number): Promise<string> {
        return await this.ethersContract.tokenURI(nftId)
    }

    /**
     * Gives permission to the spender to spend owner's tokens
     * @param owner Address of owner of the tokens that will be used
     * @param spender Address of the spender that will use the tokens of owner
     * @param nftId ID of the NFT that will be transferred
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

        const { network, ethers } = Provider.instance

        const [gasPrice, nonce, data, gasLimit] = await Promise.all([
            ethers.getGasPrice(),
            ethers.getNonce(owner),
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
            chainId: network.id,
            to: spender
        })
    }

    /**
     * @param nftId ID of the NFT that will be transferred
     * @returns Amount of the tokens that is being used by spender
     */
    async getApproved(nftId: number): Promise<string> {
        return await this.ethersContract.getApproved(nftId)
    }
}
