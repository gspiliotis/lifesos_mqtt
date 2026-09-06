import eslint from '@eslint/js';
import jest from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';

import simpleImportSort from "eslint-plugin-simple-import-sort";

const config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'Common rules for all files',
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      'indent': ['error', 2, {
        SwitchCase: 1,
        flatTernaryExpressions: true,
      }],
      'quotes': ['error', 'single'],
      'no-multi-spaces': 'error',
      'block-spacing': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'comma-spacing': ['error', {
        before: false,
        after: true,
      }],
      'eol-last': ['error', 'always'],
      'func-call-spacing': ['error', 'never'],
      'key-spacing': ['error', {
        beforeColon: false,
      }],
      'keyword-spacing': 'error',
      'no-console': 'warn',
      'no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 1,
        maxBOF: 0,
      }],
      'no-nested-ternary': 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always', {
        arraysInObjects: true,
        objectsInObjects: true,
      }],
      'semi': ['error', 'always'],
      'semi-style': ['error', 'last'],
      'space-before-blocks': 'error',
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        caughtErrors: 'none'
      }],
      'simple-import-sort/imports': ['error', {
        groups: [['^\\u0000', '^node:', '^@?\\w', '^', '^\\.']],
      }],
    }
  },
  {
    files: ['**/**.test.ts'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      ...jest.configs['flat/style'].rules,
      'jest/no-disabled-tests': 'error',
      'jest/no-duplicate-hooks': 'error',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-contain': 'error',
      'jest/prefer-to-have-length': 'error',
      'jest/valid-expect': 'error',
    },
  },
);

export default config;
