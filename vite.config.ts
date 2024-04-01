import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({
            entryRoot: './src'
        })
    ],
    build: {
        minify: true,
        sourcemap: true,
        lib: {
            entry: './src/index.ts',
            formats: ['es', 'umd'],
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
