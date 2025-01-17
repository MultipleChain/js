import { Provider } from '../services/Provider'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { type Cell, SendMode, type MessageRelaxed } from '@ton/core'
import type { OpenedContract, WalletContractV4, WalletContractV5R1 } from '@ton/ton'
import type { PrivateKey, TransactionId, TransactionSignerInterface } from '@multiplechain/types'

export class TransactionSigner implements TransactionSignerInterface<MessageRelaxed[], Cell> {
    /**
     * Transaction data from the blockchain network
     */
    rawData: MessageRelaxed[]

    /**
     * Signed transaction data
     */
    signedData: Cell

    /**
     * Blockchain network provider
     */
    provider: Provider

    /**
     * Wallet contract
     */
    wallet: OpenedContract<WalletContractV5R1 | WalletContractV4>

    /**
     * @param rawData - Transaction data
     * @param provider - Blockchain network provider
     */
    constructor(rawData: MessageRelaxed, provider?: Provider) {
        this.rawData = [rawData]
        this.provider = provider ?? Provider.instance
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @returns Signed transaction data
     */
    async sign(privateKey: PrivateKey): Promise<this> {
        const { publicKey, secretKey } = await mnemonicToPrivateKey(privateKey.split(' '))
        const contract = this.provider.createWalletV5R1(publicKey)
        this.wallet = this.provider.client1.open(contract)
        const seqno = await this.wallet.getSeqno()
        this.signedData = this.wallet.createTransfer({
            seqno,
            secretKey,
            messages: this.rawData,
            sendMode: SendMode.PAY_GAS_SEPARATELY
        })
        return this
    }

    /**
     * Sign the transaction
     * @param privateKey - Transaction data
     * @returns Signed transaction data
     */
    async signV4(privateKey: PrivateKey): Promise<this> {
        const { publicKey, secretKey } = await mnemonicToPrivateKey(privateKey.split(' '))
        const contract = this.provider.createWalletV4(publicKey)
        this.wallet = this.provider.client1.open(contract)
        const seqno = await this.wallet.getSeqno()
        this.signedData = this.wallet.createTransfer({
            seqno,
            secretKey,
            messages: this.rawData,
            sendMode: SendMode.PAY_GAS_SEPARATELY
        })
        return this
    }

    /**
     * Send the transaction to the blockchain network
     * @returns Transaction ID
     */
    async send(): Promise<TransactionId> {
        try {
            await this.wallet.send(this.signedData)
            return await this.provider.findTxHashByBodyHash(this.signedData.hash().toString('hex'))
        } catch (error) {
            console.error(error)
            return ''
        }
    }

    /**
     * @returns raw transaction data
     */
    getRawData(): MessageRelaxed[] {
        return this.rawData
    }

    /**
     * Add a message to the transaction
     * @param message - Message data
     * @returns Transaction signer
     */
    addMessage(message: MessageRelaxed): this {
        this.rawData.push(message)
        return this
    }

    /**
     * @returns signed transaction data
     */
    getSignedData(): Cell {
        return this.signedData
    }
}
