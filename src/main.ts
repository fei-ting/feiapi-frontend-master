import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import '@/styles/global.css';
import { registerGlobalErrorHandlers, reportError } from '@/services/errorReporter';

const app = createApp(App);

/**
 * 全局错误处理器
 * 捕获未处理的渲染错误和组件错误
 */
app.config.errorHandler = (err, instance, info) => {
  reportError(err, {
    source: 'vue-global',
    component: instance?.$?.type?.name || 'Unknown',
    info,
  });
};

registerGlobalErrorHandlers();
app.use(createPinia()).use(router).mount('#app');
