import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const User = {
  template: '<div>User {{ $route.params.id }}</div>'
}

const routes = [
  { path: '/user/:id', component: User },
  {
    path: "/table",
    name: "table",
    component: () =>
      import(/* webpackChunkName: "table" */ "../components/Table.vue")
  }
];

const router = new VueRouter({
  routes
});

export default router;
