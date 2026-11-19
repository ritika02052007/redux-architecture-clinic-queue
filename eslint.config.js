import js from '@eslint/js';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  { files: ['**/*.{js,jsx}'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react, 'react-hooks': hooks }, settings: { react: { version: 'detect' } },
    rules: { ...react.configs.recommended.rules, ...hooks.configs.recommended.rules, 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off', 'no-unused-vars': 'error' } },
];
