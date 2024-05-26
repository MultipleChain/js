// Create dynamic types

import fs from 'fs'
import { networks } from './src/index'

console.log('\r\nCreating dynamic types...')

const networkTypes: string[] = []

Object.entries(networks).forEach(([key, value]) => {
    if (typeof value === 'object' && key !== '__esModule') {
        const type = `    ${key}: EvmNetworkConfigInterface;`
        networkTypes.push(type)
    }
})

const content = fs.readFileSync('./dist/services/Networks.d.ts', 'utf-8')
const insertIndex = content.lastIndexOf('}')
const updatedContent =
    content.slice(0, insertIndex) + networkTypes.join('\n') + '\n' + content.slice(insertIndex)

fs.writeFileSync('./dist/services/Networks.d.ts', updatedContent)

console.log('Dynamic types created successfully!')
