import Vue from 'vue'
import App from '../view/devtools.vue'
import Element from 'element-ui'
import '../element-variables.scss'

Vue.use(Element)
chrome.devtools.panels.create('web-performance', '', 'devtools.html')
Vue.config.productionTip = false

new Vue({
    render: (h) => h(App)
}).$mount('#app')
