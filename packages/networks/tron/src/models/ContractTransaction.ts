import TxDecoder from '@beycan/tron-tx-decoder'
import { Transaction, type TransactionData } from './Transaction'
import type { ContractAddress, ContractTransactionInterface } from '@multiplechain/types'

export interface DecodedInputData {
    methodName: string
    inputNames: string[]
    inputTypes: string[]
    decodedInput: {
        [key: string]: any
        _length: number
    }
}

export class ContractTransaction extends Transaction implements ContractTransactionInterface {
    /**
     * @returns Contract address of the transaction
     */
    async getAddress(): Promise<ContractAddress> {
        const data = await this.getData()
        return this.provider.tronWeb.address.fromHex(
            data?.raw_data.contract[0].parameter.value.contract_address ?? ''
        )
    }

    /**
     * @param txData Transaction data
     * @returns Decoded transaction data
     */
    async decodeData(txData?: TransactionData): Promise<DecodedInputData | null> {
        if (txData === undefined) {
            const data = await this.getData()
            if (data === null) return null
            txData = data
        }

        const decoder = new TxDecoder(this.provider.node.host)
        const decodeData = await decoder.decodeInputById(this.id)

        return decodeData as DecodedInputData
    }
}
