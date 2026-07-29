import type { Component } from 'vue';

/** 区域导航项。 */
export interface SectionNavigationItem {
  /** 导航项唯一标识。 */
  readonly key: string;
  /** 导航项显示文本。 */
  readonly label: string;
  /** 导航项目标路由。 */
  readonly to: string;
  /** 导航项图标组件。 */
  readonly icon: Component;
}
