import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({
            entryRoot: './src'
        })
    ],
    build: {
        sourcemap: true,
        lib: {
            entry: './src/index.ts',
            formats: ['es', 'cjs', 'umd'],
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
