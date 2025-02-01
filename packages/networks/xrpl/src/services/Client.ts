import axios from 'axios'
import type { TransactionData } from '../models'
import type { AccountInfoResponse, ErrorResponse, LedgerResponse } from 'xrpl'

export default class Client {
    private readonly rpcUrl: string

    constructor(rpcUrl: string) {
        this.rpcUrl = rpcUrl
    }

    async request(method: string, params: any): Promise<any> {
        try {
            const response = await axios.post(this.rpcUrl, {
                method,
                params: [params]
            })

            if (response.status !== 200 || response.data.error) {
                throw new Error(JSON.stringify(response.data))
            }

            return response.data
        } catch (error) {
            return error as Error
        }
    }

    async getMinimumReserve(): Promise<number> {
        const result = await this.request('server_info', {})

        if (result instanceof Error) {
            throw result
        }

        return result.info.validated_ledger.reserve_base_xrp
    }

    async getAccountInfo(address: string): Promise<AccountInfoResponse> {
        return await this.request('account_info', {
            account: address,
            ledger_index: 'validated'
        })
    }

    isError(response: any): response is ErrorResponse {
        return response && response.status === 'error'
    }

    async getBalance(address: string): Promise<string> {
        const { result } = await this.getAccountInfo(address)

        if (this.isError(result)) {
            return '0'
        }

        return result.account_data.Balance
    }

    async getLedger(): Promise<LedgerResponse> {
        return await this.request('ledger', {
            ledger_index: 'validated'
        })
    }

    async getFee(): Promise<string> {
        const response = await this.request('fee', {})

        if (response instanceof Error) {
            throw response
        }

        return response.result.drops.minimum_fee
    }

    async getTransaction(txId: string): Promise<TransactionData> {
        const { result } = await this.request('tx', {
            transaction: txId
        })

        if (result.error) {
            throw new Error(result.error_message as string)
        }

        return result
    }
}
