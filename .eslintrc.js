module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsdoc/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'jsdoc'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lodash',
            message: 'Prefer individual module import from lodash.',
          },
        ],
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc', caseInsensitive: false },
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'unknown',
          'object',
        ],
        pathGroups: [{ pattern: '~/**', group: 'internal', position: 'after' }],
      },
    ],
    'jsdoc/require-jsdoc': ['error', { publicOnly: true }],
  },
  overrides: [
    {
      files: ['*.js', '*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          '~': './src',
        },
        extensions: ['.js', '.ts'],
      },
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
