import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import envCompatible from 'vite-plugin-env-compatible'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        dts({
            entryRoot: './src'
        }),
        envCompatible(),
        nodePolyfills()
    ],
    build: {
        minify: true,
        sourcemap: true,
        lib: {
            formats: ['es', 'umd'],
            entry: './src/browser/index.ts',
            fileName: (format: string) => `index.${format}.js`
        }
    },
    server: {
        watch: {
            usePolling: true,
            interval: 1000
        },
        port: 3000,
        host: true,
        strictPort: true
    }
})
