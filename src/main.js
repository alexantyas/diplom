import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap';

import store from './store'; 
const app = createApp(App);
app.use(router);
app.use(store);
app.mount('#app');