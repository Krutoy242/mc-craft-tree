module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:vue/essential'
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
    'd3': 'readonly',
  },
  'parserOptions': {
    'parser': 'babel-eslint',
    'ecmaVersion': 2020,
    'sourceType': 'module'
  },
  'plugins': [
    'vue',
    'plugin:vue/essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',

    '@vue/prettier',
    '@vue/prettier/@typescript-eslint'
  ],
  'rules': {
    'indent': [
      'error',
      2
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'no-unused-vars': ["error", { "argsIgnorePattern": "^_" }],
  }
}