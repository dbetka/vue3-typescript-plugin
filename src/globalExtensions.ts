import { HelloModule } from '@/types'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $hello: HelloModule
  }
}
