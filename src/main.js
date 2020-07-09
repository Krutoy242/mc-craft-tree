import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./router";
import numeral from 'numeral';
import vueCurveText from '@inotom/vue-curve-text';
import numFormat from 'vue-filter-number-format';
import WrappedComponent from "vue-wrapped-component"


import TreeEntry from "./components/TreeEntry.vue";
import TreeEntryName from "./components/TreeEntryName.vue";
import Hedgehog from "./components/Hedgehog.vue";
import BigNumber from "./components/BigNumber.vue";
import ProcessingSteps from "./components/ProcessingSteps.vue";
import Complexity from "./components/Complexity.vue";
import VueKonva from 'vue-konva';

// Global components
Vue.component('tree-entry', TreeEntry);
Vue.component('tree-entry-name', TreeEntryName);
Vue.component('hedgehog', Hedgehog);
Vue.component('big-number', BigNumber);
Vue.component('processing-steps', ProcessingSteps);
Vue.component('complexity', Complexity);
Vue.component('curve-text', vueCurveText);


// Numbers
Vue.filter('numFormat', numFormat(numeral));

// Cookies
Vue.use(require('vue-cookies'));
// set default config
Vue.$cookies.config('7d')

Vue.use(WrappedComponent);
Vue.use(VueKonva);

Vue.config.productionTip = false;

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount("#app");
