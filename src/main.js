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
    alias: '/home',
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

Vue.config.errorHandler = function (err, vm, info) {
  alert('Sorry, there was a problem: ' + err);
  console.log('VUE ERROR: ' + 'err: ' + err + ' vm: ' + vm + ' info: ' + info);
};

window.onerror = function (msg, url, line, col, error) {
  alert('Sorry, there was a problem: ' + msg);
  console.log('NON-VUE ERROR: ' + 'msg: ' + msg + ' url: ' + url + ' line: ' + line + '(' + col + ') error:' + error);
};

window.addEventListener('unhandledrejection', function(event) {
  alert('Sorry, there was a problem connecting with the server\n' + event.reason);
  console.log('PROMISE ERROR: ' + 'promise: ' + event.promise + ' reason: ' + event.reason);
});

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
