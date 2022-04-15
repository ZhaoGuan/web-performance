import Vue from 'vue'
import App from '../view/popup.vue'
import Element from 'element-ui'
import '../element-variables.scss'
import {getLCP, getFID, getCLS, getFCP, getTTFB} from 'web-vitals';
import {SideeX} from "@sideex/api"

var sideex = new SideeX();

Vue.use(Element)
Vue.config.productionTip = false
new Vue({
    render: (h) => h(App)
}).$mount('#app')

export {getLCP, getFID, getCLS, getFCP, getTTFB, sideex}