import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  // 全局忽略生成物、依赖目录、报告目录和旧配置
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '.eslintcache',
      '.prettierrc.js',
    ],
  },

  // JavaScript 和 ECMAScript Module 文件启用推荐规则
  js.configs.recommended,

  // TypeScript 文件启用推荐规则
  ...tseslint.configs.recommended,

  // Vue 单文件组件启用 Vue 3 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // 针对 Vue 文件的 TypeScript 解析器配置
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // 保留 Vue 质量规则，但关闭与格式化工具职责重叠的布局规则
  {
    files: ['**/*.vue'],
    rules: {
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/html-indent': 'off',
      'vue/html-quotes': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/mustache-interpolation-spacing': 'off',
      'vue/no-multi-spaces': 'off',
      'vue/no-spaces-around-equal-signs-in-attribute': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },

  // 浏览器运行时代码
  {
    files: ['src/**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Node.js 环境文件，包括配置、脚本和 Playwright 测试
  {
    files: [
      '*.config.{js,mjs,ts}',
      'eslint.config.js',
      'scripts/**/*.{js,mjs,ts}',
      'tests/e2e/**/*.{js,ts}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Vitest 测试文件环境，浏览器全局由 src 目录配置提供
  {
    files: [
      'src/**/*.{test,spec}.{js,ts}',
      'src/**/__tests__/**/*.{js,ts}',
    ],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },

  // 自定义规则
  {
    files: ['**/*.{js,mjs,ts,vue}'],
    rules: {
      // 允许以 _ 开头的未使用变量
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // 测试文件允许定义多个组件
  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
];
