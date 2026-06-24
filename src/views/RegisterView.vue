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
            <button class="fei-tab is-active" type="button">账户密码注册</button>
          </div>

          <form class="fei-form" @submit.prevent="handleSubmit">
            <div class="fei-field">
              <label class="fei-label" for="userAccount">用户名</label>
              <input id="userAccount" v-model="form.userAccount" class="fei-input" placeholder="请输入账号" />
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
            <div class="fei-field">
              <label class="fei-label" for="checkPassword">确认密码</label>
              <input
                id="checkPassword"
                v-model="form.checkPassword"
                class="fei-input"
                type="password"
                placeholder="请确认密码"
              />
            </div>
            <button class="fei-btn fei-btn--primary" type="submit">注册</button>
          </form>

          <div class="fei-toolbar" style="margin-top: 18px; justify-content: space-between">
            <a href="#/login">返回登录</a>
            <a href="#/home">返回首页</a>
          </div>
        </div>
      </div>
    </div>
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';

const router = useRouter();
const form = reactive({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
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
  if (form.userPassword !== form.checkPassword) {
    showToast('两次输入的密码不一致', 'error');
    return;
  }
  try {
    await userService.register({
      userAccount: form.userAccount.trim(),
      userPassword: form.userPassword,
      checkPassword: form.checkPassword,
    });
    showToast('注册成功', 'success');
    await router.push('/login');
  } catch {
    showToast('注册失败，请重试', 'error');
  }
};
</script>
