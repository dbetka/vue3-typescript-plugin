import { App } from 'vue'

export declare interface HelloModule {
  sayHello (name: string): string;
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $hello: HelloModule
  }
}

declare namespace _default {
  function install(app: App): void;
}
export default _default
