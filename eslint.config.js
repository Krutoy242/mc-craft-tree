import antfu from '@antfu/eslint-config'

export default antfu({
  // typescript: { tsconfigPath: 'tsconfig.json' },
  gitignore: false,
}, {
  files: ['**/*.md'],
  rules: {
    'style/no-trailing-spaces': 'off',
  },
})
