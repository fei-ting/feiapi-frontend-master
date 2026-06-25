<template>
  <div class="fei-app-shell">
    <div class="fei-page" style="display: flex; align-items: center; min-height: calc(100vh - 64px)">
      <div class="fei-container" style="max-width: 480px">
        <div class="fei-panel">
          <div class="fei-empty" style="padding: 0 0 24px">
            <h1 class="fei-detail__title" style="font-size: 28px; margin-bottom: 8px">FeiAPI</h1>
            <p class="fei-section-desc">API 开放平台</p>
          </div>

          <div class="fei-tabbar">
            <button class="fei-tab is-active" type="button">账户密码登录</button>
          </div>

          <form class="fei-form" @submit.prevent="handleSubmit">
            <div class="fei-field">
              <label class="fei-label" for="userAccount">用户名</label>
              <input id="userAccount" v-model="form.userAccount" class="fei-input" placeholder="请输入用户名" />
            </div>
            <div class="fei-field">
              <label class="fei-label" for="userPassword">密码</label>
              <input
                id="userPassword"
                v-model="form.userPassword"
                class="fei-input"
                type="password"
                placeholder="请输入密码"
              />
            </div>
            <button class="fei-btn fei-btn--primary" type="submit">登录</button>
          </form>

          <div class="fei-toolbar" style="margin-top: 18px; justify-content: space-between">
            <a href="#/register">新用户注册</a>
            <a href="#/home">返回首页</a>
          </div>
        </div>
      </div>
    </div>
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';

const router = useRouter();
const form = reactive({
  userAccount: '',
  userPassword: '',
});
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => {
    toast.visible = false;
  }, 2200);
};

const handleSubmit = async () => {
  try {
    await userService.login({
      userAccount: form.userAccount.trim(),
      userPassword: form.userPassword,
    });
    showToast('登录成功', 'success');

    // 获取登录用户信息，管理员跳转后台工作台
    try {
      const res = await userService.getLoginUser();
      const user = res.data;
      if (user?.userRole === 'admin') {
        await router.push('/admin/dashboard');
        return;
      }
    } catch {
      // 获取用户信息失败时使用默认跳转
    }

    await router.push('/home');
  } catch (error) {
    // 显示后端返回的具体错误信息
    const message = error instanceof Error ? error.message : '登录失败，请重试';
    showToast(message, 'error');
  }
};
</script>
