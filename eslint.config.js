import antfu from '@antfu/eslint-config'

export default antfu({
  // typescript: { tsconfigPath: 'tsconfig.json' },
  gitignore: false,
  rules: {
    'style/max-statements-per-line': 'off',
  },
}, {
  files: ['**/*.md'],
  rules: {
    'style/no-trailing-spaces': 'off',
  },
})
