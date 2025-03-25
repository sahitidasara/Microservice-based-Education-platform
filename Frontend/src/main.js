import Vue from 'vue/dist/vue.js'; // Use full build with compiler
import App from './App.vue';
import VueRouter from 'vue-router'; // Import VueRouter
import router from './router';
import axios from 'axios';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Register VueRouter with Vue
Vue.use(VueRouter);
Vue.prototype.$http = axios;
Vue.config.productionTip = false;

new Vue({
    router,
    render: h => h(App),
}).$mount('#app');