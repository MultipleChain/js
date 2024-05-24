export class Wrapper<T extends Record<string, any>> {
    protected currentNetwork?: T[keyof T]

    constructor(private readonly networkPackages: T) {}

    select<K extends keyof T>(networkName: K): void {
        if (this.networkPackages[networkName] === undefined) {
            throw new Error(`Network ${String(networkName)} not included!`)
        }

        this.currentNetwork = this.networkPackages[networkName]
    }

    get current(): T[keyof T] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork
    }

    get utils(): T[keyof T]['utils'] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.utils
    }

    get types(): T[keyof T]['types'] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.types
    }

    get assets(): T[keyof T]['assets'] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.assets
    }

    get models(): T[keyof T]['models'] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.models
    }

    get services(): T[keyof T]['services'] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.services
    }

    get Provider(): T[keyof T]['Provider'] {
        if (this.currentNetwork === undefined) {
            throw new Error('Network not selected')
        }

        return this.currentNetwork?.Provider
    }
}
