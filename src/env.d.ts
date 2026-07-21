/// <reference types="vite/client" />

/** Vite 环境变量类型声明 */
interface ImportMetaEnv {
  /** API 基础地址 */
  readonly VITE_API_BASE: string;
  /** 是否在开发环境启用 Dashboard Mock 降级 */
  readonly VITE_ENABLE_MOCK?: string;
  /** 允许展示头像的外部 HTTPS Origin，多个值使用英文逗号分隔 */
  readonly VITE_AVATAR_ALLOWED_ORIGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
