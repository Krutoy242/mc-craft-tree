const WorkerPlugin = require('worker-plugin')

module.exports = {
  transpileDependencies: ['vuetify'],
  lintOnSave: false,
  chainWebpack: (config) => {
    config.plugin('worker').use(WorkerPlugin)
  },
  configureWebpack: {
    devtool: 'source-map',
  },
  publicPath: process.env.NODE_ENV === 'production' ? '/CraftTreeVisualizer/' : '/',
}
