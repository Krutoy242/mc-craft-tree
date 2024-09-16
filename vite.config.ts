import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import {
  PrimeVueResolver,
} from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'

export default defineConfig({
  // base   : '/tree/',
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      'mc-gatherer/': `${path.resolve(__dirname, 'mc-gatherer/src')}/`,
    },
  },
  plugins: [
    Vue({
      reactivityTransform: true,
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue/macros',
        'vue-router',
        '@vueuse/core',
      ],
      dts: true,
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: true,
      resolvers: [PrimeVueResolver()],
    }),

    // https://github.com/antfu/unocss
    // see unocss.config.ts for config
    Unocss(),
  ],
})
