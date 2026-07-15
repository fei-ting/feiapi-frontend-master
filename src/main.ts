import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import '@/styles/global.css';

const app = createApp(App);

/**
 * 全局错误处理器
 * 捕获未处理的渲染错误和组件错误
 */
app.config.errorHandler = (err, instance, info) => {
  console.error('[全局错误] 捕获到未处理的错误:', {
    error: err,
    component: instance?.$?.type?.name || 'Unknown',
    info,
  });
  // TODO: 在此处接入错误上报服务（如 Sentry）
};

app.use(createPinia()).use(router).mount('#app');
