import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    // Build/config files run in Node, so allow Node globals (__dirname, process, …).
    files: ['**/*.config.js', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: '18.3' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      eqeqeq: 'error',

      'no-console': 'warn', // Warn on console.log
      'no-unused-vars': 'warn', // Warn on unused variables
      'no-debugger': 'error', // Prevent debugger in production

      // 🔧 Overrides
      'react/jsx-no-target-blank': 'off',
      // This is a plain-JS React app that doesn't use PropTypes anywhere, so the
      // prop-types rule from react/recommended only produces noise. Turn it off.
      'react/prop-types': 'off',
      // Apostrophes/quotes in JSX text render fine; this rule is purely stylistic.
      'react/no-unescaped-entities': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]