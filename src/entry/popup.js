import Vue from 'vue'
import App from '../view/popup.vue'
import Element from 'element-ui'
import '../element-variables.scss'


Vue.use(Element)
Vue.config.productionTip = false
new Vue({
    render: (h) => h(App)
}).$mount('#app')

