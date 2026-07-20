import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/** 已完成组件化整改的核心模块覆盖率阈值。 */
const coreCoverageThresholds = {
  statements: 90,
  branches: 80,
  functions: 85,
  lines: 90,
};

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/types/**',
        'src/main.ts',
      ],
      excludeAfterRemap: true,
      reporter: ['text', 'html', 'json-summary'],
      reportOnFailure: true,
      thresholds: {
        statements: 59,
        branches: 52,
        functions: 56,
        lines: 60,
        'src/components/dashboard/**': coreCoverageThresholds,
        'src/views/admin/DashboardView.vue': coreCoverageThresholds,
        'src/components/invoke/**': coreCoverageThresholds,
        'src/views/InterfaceInvokeView.vue': coreCoverageThresholds,
        'src/components/profile/**': coreCoverageThresholds,
        'src/views/profile/ProfileInfoView.vue': coreCoverageThresholds,
        'src/components/admin/doc/**': coreCoverageThresholds,
        'src/views/admin/InterfaceDocMaintenanceView.vue': coreCoverageThresholds,
        'src/components/auth/**': coreCoverageThresholds,
        'src/composables/useAuthForm.ts': coreCoverageThresholds,
        'src/views/LoginView.vue': coreCoverageThresholds,
        'src/views/RegisterView.vue': coreCoverageThresholds,
        'src/composables/useQuota.ts': coreCoverageThresholds,
        'src/views/admin/QuotaConfigView.vue': coreCoverageThresholds,
      },
    },
  },
});
