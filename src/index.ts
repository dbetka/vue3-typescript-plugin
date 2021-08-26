import './style/index.scss'
import Menu from './components/Menu.vue'
import { HelloPlugin } from '@/types'

const hello: HelloPlugin = {
  sayHello (name) {
    return `Hello ${name}`
  },
  install (app) {
    app.config.globalProperties.$hello = this
  },
}

export {
  Menu,
  HelloPlugin,
  hello,
}
