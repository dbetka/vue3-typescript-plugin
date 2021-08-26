import { App } from 'vue'
import './style/index.scss'
import Menu from './components/Menu.vue'


export interface HelloModule {
  sayHello (name: string): string;
}

export const Component = Menu

export default {
  install (app: App): void {
    const helloModule: HelloModule = {
      sayHello (name) {
        return `Hello ${name}`
      }
    }

    app.config.globalProperties.$hello = helloModule
  },
}
