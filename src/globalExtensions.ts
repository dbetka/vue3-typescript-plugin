import { HelloPlugin } from '@/types'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $hello: HelloPlugin
  }
}
