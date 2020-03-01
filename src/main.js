import Vue from 'vue'
import VueRouter from "vue-router";
import App from './App.vue'
import {BootstrapVue, IconsPlugin} from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import StatsPage from "./components/StatsPage";
import ResultsPage from "./components/ResultsPage";
import PlayersPage from "./components/PlayersPage";
import HomePage from "./components/HomePage";

import './custom.scss';

Vue.config.productionTip = false;

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    component: HomePage,
    meta: {
      auth: false,
      title: '',
    },
  }, {
    path: '/results',
    component: ResultsPage,
    meta: {
      auth: false,
      title: 'Results',
    },
  }, {
    path: '/players',
    component: PlayersPage,
    meta: {
      auth: false,
      title: 'Players',
    },
  }, {
    path: '/stats/:statType',
    component: StatsPage,
    props: true,
    meta: {
      auth: false,
      title: 'Stats',
    },
  },
];

const router = new VueRouter({
  routes
});



new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
