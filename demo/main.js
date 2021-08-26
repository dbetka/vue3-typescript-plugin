import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import VueTypescriptPlugin, { Component } from '../src/index'

createApp(App)
  .use(VueTypescriptPlugin)
  .mount('#app')

console.log(Component)
