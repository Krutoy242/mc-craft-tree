import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/table',
    name: 'table',
    props: true,
    component: () => import(/* webpackChunkName: "table" */ '../views/Table.vue'),
  },
  {
    path: '/graph',
    name: 'graph',
    props: true,
    component: () => import(/* webpackChunkName: "graph" */ '../views/Graph.vue'),
  },
  {
    path: '/history',
    name: 'history',
    props: true,
    component: () => import(/* webpackChunkName: "history" */ '../views/History.vue'),
  },
  {
    path: '*',
    redirect: '/graph',
  },
]

const router = new VueRouter({
  // mode: "history",
  routes,
  base: '/CraftTreeVisualizer/',
})

export default router
