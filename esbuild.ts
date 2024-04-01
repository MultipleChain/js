import { build, type BuildOptions } from 'esbuild'

const baseConfig: BuildOptions = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    minify: true,
    sourcemap: true,
    logLevel: 'info',
    outfile: 'dist/index.cjs'
}

export default (customConfig: BuildOptions = {}): void => {
    build({
        ...baseConfig,
        ...customConfig
    }).catch(() => process.exit(1))
}
