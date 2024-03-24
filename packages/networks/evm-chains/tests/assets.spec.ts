import { describe, it, expect, assert } from 'vitest'

import { Coin } from '../src/assets/Coin.ts'
import { TransactionSigner } from '../src/services/TransactionSigner.ts'
import { Transaction } from '../src/models/Transaction.ts'
import { Contract } from '../src/assets/Contract.ts'
import ERC20 from '../resources/erc20.json'
import { numberToHex } from '@multiplechain/utils'

const transferTestIsOpen = false

const balanceTestAddress = '0x760A4d3D03928D1e8541A7644B34370c1b79aa9F'
const tokenTestAddress = '0x4294cb0dD25dC9140B5127f247cBd47Eeb673431'
const coinBalanceTestAmount = 0.01
const tokenBalanceTestAmount = 1000

const walletPrivateKey = '14bd9af4e87981b37b7b2e8a0d1d249b7fcdb7a3bc579c4c31488842d372c0e9'
const senderTestAddress = '0x110600bF0399174520a159ed425f0D272Ff8b459'
const receiverTestAddress = '0xbBa4d06D1cEf94b35aDeCfDa893523907fdD36DE'
const transferTestAmount = 0.0001

describe('Coin', () => {
    const coin = new Coin()
    it('Name and symbol', () => {
        expect(coin.getName()).toBe('Ethereum')
        expect(coin.getSymbol()).toBe('ETH')
    })

    it('Decimals', () => {
        expect(coin.getDecimals()).toBe(18)
    })

    it('Balance', async () => {
        const balance = await coin.getBalance(balanceTestAddress)
        expect(balance).toBe(coinBalanceTestAmount)
    })

    it('Transfer', async () => {
        if (!transferTestIsOpen) return
        const signer = await coin.transfer(
            senderTestAddress,
            receiverTestAddress,
            transferTestAmount
        )

        expect(signer).toBeInstanceOf(TransactionSigner)

        const rawData = signer.getRawData()

        assert.isObject(rawData)

        await signer.sign(walletPrivateKey)

        assert.isString(signer.getSignedData())

        // const beforeBalance = await coin.getBalance(receiverTestAddress)

        const transaction = await signer.send()

        expect(transaction).toBeInstanceOf(Transaction)

        // TODO: Complete after coin transaction verify method is implemented
        // const afterBalance = await coin.getBalance(receiverTestAddress)
        // expect(afterBalance).toBe(beforeBalance + transferTestAmount)
    })
})

describe('Contract', () => {
    const contract = new Contract(tokenTestAddress, ERC20)
    it('callMethod', async () => {
        const name = await contract.callMethod('name')
        expect(name).toBe('MyToken')
    })

    it('getMethodData', async () => {
        const decimals = await contract.callMethod('decimals')
        const hexAmount = numberToHex(tokenBalanceTestAmount, Number(decimals))
        const data = await contract.getMethodData('transfer', receiverTestAddress, hexAmount)
        expect(data).toBe(
            '0xa9059cbb000000000000000000000000bba4d06d1cef94b35adecfda893523907fdd36de00000000000000000000000000000000000000000000003635c9adc5dea00000'
        )
    })
})

// describe('Token', () => {})

// describe('Nft', () => {})
