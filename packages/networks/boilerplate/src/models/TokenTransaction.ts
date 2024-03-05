import { AssetTransaction } from './AssetTransaction.ts'
import { TransactionStatusEnum } from '@multiplechain/types'
import type { AssetDirectionEnum, TokenTransactionInterface } from '@multiplechain/types'

export class TokenTransaction extends AssetTransaction implements TokenTransactionInterface {
    /**
     * @returns Token address of the transaction
     */
    getAddress(): string {
        return 'example'
    }

    verifyApprove(
        direction: AssetDirectionEnum,
        address: string,
        amount: number
    ): TransactionStatusEnum {
        return TransactionStatusEnum.PENDING
    }
}
