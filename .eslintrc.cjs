module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: ['standard-with-typescript', 'plugin:prettier/recommended'],
    overrides: [
        {
            env: {
                node: true
            },
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
                sourceType: 'script'
            }
        }
    ],
    parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['prettier', 'filenames'],
    rules: {
        'filenames/match-exported': ['error', 'pascal']
    },
    ignorePatterns: ['**/*.d.ts', 'dist/', 'node_modules/']
}
