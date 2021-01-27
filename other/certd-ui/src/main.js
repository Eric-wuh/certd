import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import '@/style/common.less'
import { i18n } from '@/i18n'
import icons from './icons'
import DContainer from '@/components/d-container'
const app = createApp(App)
app.config.productionTip = false
app.use(i18n)
app.use(Antd)
icons(app)
app.component('d-container', DContainer)
app.use(router).mount('#app')
