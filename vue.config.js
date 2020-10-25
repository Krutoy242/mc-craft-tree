module.exports = {
  transpileDependencies: ['vuetify'],
  lintOnSave: false,
  configureWebpack: {
    devtool: 'source-map'
  },
  publicPath: process.env.NODE_ENV === 'production'
    ? '/CraftTreeVisualizer/'
    : '/'
}
