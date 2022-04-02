import './router/componentHooks.ts'

Object.defineProperty(String.prototype, 'hashCode', {
  value: function () {
    let hash = 0,
      i,
      chr
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i)
      hash = (hash << 5) - hash + chr
      hash |= 0 // Convert to 32bit integer
    }
    return hash
  },
})

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore

import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import numeral from 'numeral'
import numFormat from 'vue-filter-number-format'
import { paramCase } from 'change-case'
import VueCookies from 'vue-cookies'

import WrappedComponent from 'vue-wrapped-component'
Vue.use(WrappedComponent)

import VueNonreactive from 'vue-nonreactive'
Vue.use(VueNonreactive)

import vueCurveText from '@inotom/vue-curve-text'
import { ThisTypedComponentOptionsWithArrayProps } from 'vue/types/options'
Vue.component('CurveText', vueCurveText)

const requireComponent = require.context(
  // Look for files in the directory
  './components',
  // Do not look in subdirectories
  false,
  // File name pattern
  /^.*\.vue$/
)

// For each matching file name...
requireComponent.keys().forEach((fileName) => {
  // Get the component config
  const componentConfig = requireComponent(fileName)
  // Get the PascalCase version of the component name
  const componentName = paramCase(
    fileName
      // Remove the file extension from the end
      .replace(/\.\w+$/, '')
  )

  // Globally register the component
  Vue.component(componentName, componentConfig.default || componentConfig)
})

// Numbers
Vue.filter('numFormat', numFormat(numeral))

// Cookies
Vue.use(VueCookies)
Vue.$cookies.config('7d') // set default config
Vue.prototype.$tree = null

Vue.config.productionTip = false

new Vue({
  vuetify,
  router,
  created() {
    if (sessionStorage.redirect) {
      const redirect = sessionStorage.redirect
      delete sessionStorage.redirect
      void this.$router.push(redirect)
    }
  },
  render: (h) => h(App),
} as ThisTypedComponentOptionsWithArrayProps<Vue, object, object, object, never>).$mount('#app')
