/// <reference types="vite/client" />

/** Vite 环境变量类型声明 */
interface ImportMetaEnv {
  /** API 基础地址 */
  readonly VITE_API_BASE: string;
  /** 是否在开发环境启用 Dashboard Mock 降级 */
  readonly VITE_ENABLE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
