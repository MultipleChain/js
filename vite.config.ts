import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [nodePolyfills()],
    build: {
        commonjsOptions: {
            transformMixedEsModules: true
        },
        assetsDir: '.',
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: 'src/main.ts'
            },
            output: {
                format: 'umd',
                entryFileNames: 'app.min.js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
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
