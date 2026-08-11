import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 样式架构测试
 * 验证样式分层是否正确：
 * 1. base.css 不再导入 pages/ 目录中的文件
 * 2. 每个页面或布局入口显式导入其负责的样式模块
 * 3. responsive.css 不再包含已迁移的页面专属选择器
 * 4. 已删除的 Dashboard 死样式选择器不再出现在生产样式中
 * 5. 跨路由复用样式位于全局或功能共享层
 */

const srcDir = resolve(process.cwd(), 'src');

/**
 * 读取文件内容
 */
function readFile(relativePath: string): string {
  return readFileSync(resolve(srcDir, relativePath), 'utf8');
}

describe('样式架构', () => {
  describe('8.1 全局样式不导入页面样式', () => {
    it('base.css 不再导入 pages/ 目录中的文件', () => {
      const baseCss = readFile('styles/base.css');

      // 验证不包含任何 pages/ 目录的导入
      expect(baseCss).not.toContain("@import './pages/");
      expect(baseCss).not.toContain('@import "./pages/');

      // 验证只保留全局核心层样式
      expect(baseCss).toContain("@import './tokens.css'");
      expect(baseCss).toContain("@import './reset.css'");
      expect(baseCss).toContain("@import './layout.css'");
      expect(baseCss).toContain("@import './components/navigation.css'");
      expect(baseCss).toContain("@import './components/cards.css'");
      expect(baseCss).toContain("@import './components/common.css'");
      expect(baseCss).toContain("@import './responsive.css'");
    });

    it('dashboard.css 死样式文件已被删除', () => {
      // 验证 dashboard.css 文件不存在
      expect(() => readFile('styles/pages/dashboard.css')).toThrow();
    });

    it('dashboard.css 死样式选择器不再出现在其他样式文件中', () => {
      const baseCss = readFile('styles/base.css');
      const responsiveCss = readFile('styles/responsive.css');

      // 验证不包含 dashboard.css 中的选择器
      expect(baseCss).not.toContain('.fei-analysis-grid');
      expect(baseCss).not.toContain('.fei-stat-card');
      expect(responsiveCss).not.toContain('.fei-analysis-grid');
    });

    it('跨页面按钮和行内代码样式位于通用组件层', () => {
      const commonCss = readFile('styles/components/common.css');
      const navigationCss = readFile('styles/components/navigation.css');
      const homeCss = readFile('styles/pages/home.css');
      const invokeCss = readFile('styles/pages/invoke.css');

      expect(commonCss).toMatch(/^\.fei-btn\s*\{/m);
      expect(commonCss).toContain('.fei-btn--primary');
      expect(commonCss).toContain('.fei-btn--secondary');
      expect(commonCss).toMatch(/^\.fei-code-inline\s*\{/m);
      expect(navigationCss).toContain('.fei-nav__actions .fei-btn');
      expect(homeCss).not.toMatch(/^\.fei-btn\s*\{/m);
      expect(invokeCss).not.toMatch(/^\.fei-code-inline\s*\{/m);
    });

    it('跨页面区块、面板和标题样式位于全局布局层', () => {
      const layoutCss = readFile('styles/layout.css');
      const detailCss = readFile('styles/pages/detail.css');

      expect(layoutCss).toMatch(/^\.fei-section\s*\{/m);
      expect(layoutCss).toMatch(/^\.fei-panel\s*\{/m);
      expect(layoutCss).toMatch(/^\.fei-detail__title\s*\{/m);
      expect(detailCss).not.toMatch(/^\.fei-section\s*\{/m);
      expect(detailCss).not.toMatch(/^\.fei-panel\s*\{/m);
      expect(detailCss).not.toMatch(/^\.fei-detail__title\s*\{/m);
    });
  });

  describe('8.2 响应式规则归属正确', () => {
    it('responsive.css 只包含跨应用的响应式规则', () => {
      const responsiveCss = readFile('styles/responsive.css');

      // 验证保留的跨应用规则
      expect(responsiveCss).toContain('.fei-header');
      expect(responsiveCss).toContain('.fei-header__inner');
      expect(responsiveCss).toContain('.fei-nav');
      expect(responsiveCss).toContain('.fei-nav__actions');
      expect(responsiveCss).toContain('.fei-btn.fei-mobile-toggle');
      expect(responsiveCss).toContain('.fei-grid-4');
      expect(responsiveCss).toContain('.fei-grid-3');

      // 验证不再包含页面专属规则
      expect(responsiveCss).not.toContain('.fei-admin-layout');
      expect(responsiveCss).not.toContain('.fei-admin-sidebar');
      expect(responsiveCss).not.toContain('.fei-admin-tabs');
      expect(responsiveCss).not.toContain('.fei-hero');
      expect(responsiveCss).not.toContain('.fei-hero__title');
      expect(responsiveCss).not.toContain('.fei-stats');
      expect(responsiveCss).not.toContain('.fei-info-grid');
      expect(responsiveCss).not.toContain('.fei-card-grid');
      expect(responsiveCss).not.toContain('.fei-market-header');
      expect(responsiveCss).not.toContain('.fei-search-bar');
      expect(responsiveCss).not.toContain('.fei-detail-hero');
      expect(responsiveCss).not.toContain('.fei-doc-grid');
      expect(responsiveCss).not.toContain('.fei-invoke-layout');
      expect(responsiveCss).not.toContain('.fei-invoke-request');
      expect(responsiveCss).not.toContain('.fei-invoke-result');
      expect(responsiveCss).not.toContain('.fei-debug-panel');
      expect(responsiveCss).not.toContain('.fei-form-grid');
      expect(responsiveCss).not.toContain('.fei-doc-param-row');
      expect(responsiveCss).not.toContain('.fei-doc-summary');
    });

    it('首页响应式规则在 home.css 中', () => {
      const homeCss = readFile('styles/pages/home.css');

      expect(homeCss).toContain('.fei-hero__title');
      expect(homeCss).toContain('.fei-hero');
      expect(homeCss).toContain('.fei-stats');
      expect(homeCss).not.toContain('.fei-info-grid');
    });

    it('接口广场响应式规则在 market.css 中', () => {
      const marketCss = readFile('styles/pages/market.css');

      expect(marketCss).toContain('.fei-card-grid');
      expect(marketCss).toContain('.fei-market-header');
      expect(marketCss).toContain('.fei-search-bar--compact');
      expect(marketCss).toContain('.fei-api-card');
    });

    it('接口详情页面响应式规则在 detail.css 中', () => {
      const detailCss = readFile('styles/pages/detail.css');

      expect(detailCss).toContain('.fei-detail-hero');
      expect(detailCss).toContain('.fei-layout-detail');
    });

    it('接口文档响应式规则位于功能共享样式中', () => {
      const documentationCss = readFile('features/interface-platform/documentation/styles/interface-documentation.css');

      expect(documentationCss).toContain('.fei-doc-grid');
      expect(documentationCss).toContain('.fei-doc-info-grid');
      expect(documentationCss).toContain('.fei-doc-two-col');
      expect(documentationCss).toContain('.fei-doc-section__head');
      expect(documentationCss).toContain('.fei-code-copy');
      expect(documentationCss).not.toContain('.fei-icon-btn');
    });

    it('在线调用响应式规则在 invoke.css 中', () => {
      const invokeCss = readFile('styles/pages/invoke.css');

      expect(invokeCss).toContain('.fei-invoke-layout');
      expect(invokeCss).toContain('.fei-invoke-request');
      expect(invokeCss).toContain('.fei-invoke-result');
      expect(invokeCss).toContain('.fei-invoke-output');
      expect(invokeCss).toContain('.fei-debug-panel');
    });

    it('后台布局响应式规则在 admin.css 中且导航样式由公共组件维护', () => {
      const adminCss = readFile('styles/pages/admin.css');
      const sectionNavigation = readFile('components/SectionNavigation.vue');

      expect(adminCss).toContain('.fei-admin-layout');
      expect(adminCss).not.toContain('.fei-admin-sidebar');
      expect(adminCss).not.toContain('.fei-admin-tabs');
      expect(adminCss).not.toContain('.fei-admin-nav-link');
      expect(sectionNavigation).toContain('.fei-section-navigation');
      expect(sectionNavigation).toContain('.fei-section-navigation__link');
      expect(sectionNavigation).toContain('@media (min-width: 1024px)');
    });

    it('后台工具响应式规则在 admin-tools.css 中', () => {
      const adminToolsCss = readFile('styles/pages/admin-tools.css');

      expect(adminToolsCss).toContain('.fei-form-grid');
      expect(adminToolsCss).toContain('.fei-doc-param-row');
      expect(adminToolsCss).toContain('.fei-doc-summary__meta');
      expect(adminToolsCss).toContain('.fei-doc-section__heading');
      expect(adminToolsCss).toContain('.fei-doc-editor__topbar');
    });
  });

  describe('页面样式导入正确', () => {
    it('HomeView.vue 导入 home.css', () => {
      const homeView = readFile('views/HomeView.vue');
      expect(homeView).toContain("import '@/styles/pages/home.css'");
    });

    it('InterfaceMarketView.vue 导入 market.css', () => {
      const marketView = readFile('views/InterfaceMarketView.vue');
      expect(marketView).toContain("import '@/styles/pages/market.css'");
    });

    it('InterfaceDetailView.vue 导入详情和接口文档共享样式', () => {
      const detailView = readFile('views/InterfaceDetailView.vue');
      expect(detailView).toContain("import '@/features/interface-platform/documentation/styles/interface-documentation.css'");
      expect(detailView).toContain("import '@/styles/pages/detail.css'");
    });

    it('InterfaceInvokeView.vue 导入调用和接口文档共享样式', () => {
      const invokeView = readFile('views/InterfaceInvokeView.vue');
      expect(invokeView).toContain("import '@/features/interface-platform/documentation/styles/interface-documentation.css'");
      expect(invokeView).toContain("import '@/styles/pages/invoke.css'");
    });

    it('AdminLayout.vue 导入 admin.css 和 admin-tools.css', () => {
      const adminLayout = readFile('layouts/AdminLayout.vue');
      expect(adminLayout).toContain("import '@/styles/pages/admin.css'");
      expect(adminLayout).toContain("import '@/styles/pages/admin-tools.css'");
      expect(adminLayout).toContain("import SectionNavigation from '@/components/SectionNavigation.vue'");
    });

    it('ProfileLayout.vue 导入 admin.css 和 profile.css', () => {
      const profileLayout = readFile('layouts/ProfileLayout.vue');
      expect(profileLayout).toContain("import '@/styles/pages/admin.css'");
      expect(profileLayout).toContain("import '@/styles/pages/profile.css'");
      expect(profileLayout).toContain("import SectionNavigation from '@/components/SectionNavigation.vue'");
    });
  });
});
