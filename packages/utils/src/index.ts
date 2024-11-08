import { toHex } from 'web3-utils'
import BigNumber from 'bignumber.js'
import { WebSocket as NodeWebSocket, type ErrorEvent } from 'ws'

const BASE58_ALPHABET: string = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Converts the decimal to hexadecimal
 * @param value - number or string
 * @param decimals - number
 * @returns string
 */
export const numberToHex = (value: number | string | BigNumber, decimals: number): string => {
    const length = '1' + '0'.repeat(decimals)
    const newValue = new BigNumber(value.toString(10), 10)
    return toHex(newValue.times(length).toString(16))
}

/**
 * Converts the hexadecimal to decimal
 * @param value - string
 * @param decimals - number
 * @returns number
 */
export const hexToNumber = (value: string, decimals: number): number => {
    const length = '1' + '0'.repeat(decimals)
    const newValue = new BigNumber(value.toString(), 10)
    return parseFloat(newValue.dividedBy(length).toString())
}

/**
 * Converts the given data to Base58 string. Given data may be string or an Uint8Array
 * If the given data is a string, it'll be converted to Uint8Array inside of the method
 * @param input - Uint8Array | string
 * @returns string
 */
export const base58Encode = (input: Uint8Array | string): string => {
    // Convert input to bytes if it's a string
    if (typeof input === 'string') input = new Uint8Array(Buffer.from(input))

    const base58Array: string[] = []

    // Convert the byte array to a BigInt
    let value = BigInt('0x' + Buffer.from(input).toString('hex'))

    // Base58 encoding
    while (value > BigInt(0)) {
        const remainder = Number(value % BigInt(58))
        base58Array.unshift(BASE58_ALPHABET[remainder])
        value = value / BigInt(58)
    }

    // Add '1' characters for leading zero bytes
    for (let i = 0; i < input.length; i++) {
        if (input[i] !== 0) break
        base58Array.unshift(BASE58_ALPHABET[0])
    }

    return base58Array.join('')
}

/**
 * Converts the given string to Base58 as an Uint8Array
 * @param input - string
 * @returns Uint8Array
 */
export const base58Decode = (input: string): Uint8Array => {
    let value = BigInt(0)

    for (let i = 0; i < input.length; i++)
        value = value * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(input[i]))

    const valueHex: string = value.toString(16)

    // Make the string's length even
    const hexString = valueHex.length % 2 === 0 ? valueHex : '0' + valueHex

    return new Uint8Array(Buffer.from(hexString, 'hex'))
}

/**
 * Converts the given buffer to a string
 * @param input - Buffer
 * @returns string
 */
export const bufferToString = (input: Buffer): string => {
    return Buffer.from(input).toString('utf8')
}

/**
 * Converts the given string to a buffer
 * @param input - string
 * @returns Buffer
 */
export const stringToBuffer = (input: string): Buffer => {
    return Buffer.from(input, 'utf8')
}

/**
 * Checks if given value is numeric
 * @param value - string | number
 * @returns boolean
 */
export const isNumeric = (value: string | number): boolean => {
    return !isNaN(Number(value))
}

/**
 * Sleeps the given milliseconds
 * @param ms - number
 * @returns Promise<void>
 */
export const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Checks if the given objects are equal
 * @param o1 - object
 * @param o2 - object
 * @returns boolean
 */
export const objectsEqual = (o1: object, o2: object): boolean => {
    return JSON.stringify(o1) === JSON.stringify(o2)
}

/**
 * Converts the given number to a readable string
 * @param num - number
 * @returns string
 */
export const toReadableString = (num: number): string => {
    const [coefficient, exponent] = num
        .toExponential()
        .split('e')
        .map((item) => parseFloat(item))

    let result = (coefficient * Math.pow(10, exponent)).toString()

    result = parseFloat(result).toString()

    return result
}

/**
 * checks if the given url is a valid websocket url
 * @param url - string
 * @returns Promise<boolean>
 */
export const checkWebSocket = async (url: string): Promise<boolean> => {
    return await new Promise((resolve, reject) => {
        let socket: WebSocket | NodeWebSocket

        if (typeof window !== 'undefined') {
            socket = new WebSocket(url)
        } else {
            socket = new NodeWebSocket(url)
        }

        socket.onopen = () => {
            resolve(true)
            socket.close()
        }

        socket.onerror = (error: ErrorEvent) => {
            reject(new Error(error.message))
            socket.close()
        }
    })
}

export const math = {
    add: (a: number, b: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).plus(new BigNumber(b)).toFixed(decimals))
    },
    sub: (a: number, b: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).minus(new BigNumber(b)).toFixed(decimals))
    },
    mul: (a: number, b: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).times(new BigNumber(b)).toFixed(decimals))
    },
    div: (a: number, b: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).div(new BigNumber(b)).toFixed(decimals))
    },
    pow: (a: number, b: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).pow(b).toFixed(decimals))
    },
    sqrt: (a: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).sqrt().toFixed(decimals))
    },
    abs: (a: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).absoluteValue().toFixed(decimals))
    },
    ceil: (a: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).integerValue(BigNumber.ROUND_CEIL).toFixed(decimals))
    },
    floor: (a: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).integerValue(BigNumber.ROUND_FLOOR).toFixed(decimals))
    },
    round: (a: number, decimals: number = 18): number => {
        return parseFloat(new BigNumber(a).integerValue(BigNumber.ROUND_HALF_UP).toFixed(decimals))
    }
}

declare global {
    interface Window {
        opera?: any
        WebViewJavascriptBridge?: any
        webkit?: any
    }
    interface Navigator {
        standalone?: any
    }
}

export const isMobile = (): boolean => {
    if (typeof window === 'undefined') {
        return false
    }
    /* eslint-disable */
    return (function (a) {
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
            a
        ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-/i.test(
                a.substr(0, 4)
            )
            ? true
            : false
    })(navigator.userAgent || navigator.vendor || window.opera)
    /* eslint-enable */
}

export const isWebview = (): boolean => {
    if (typeof window === 'undefined') {
        return false
    }

    /* eslint-disable */
    const navigator = window.navigator
    const userAgent = navigator.userAgent
    const normalizedUserAgent = userAgent.toLowerCase()
    const standalone = navigator.standalone
    const isIos =
        /ip(ad|hone|od)/.test(normalizedUserAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /android/.test(normalizedUserAgent)
    const isSafari = /safari/.test(normalizedUserAgent)
    return (isAndroid && /; wv\)/.test(normalizedUserAgent)) || (isIos && !standalone && !isSafari)
    /* eslint-enable */
}

export { toHex }
