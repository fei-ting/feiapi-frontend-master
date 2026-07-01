<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="home" @logout="handleLogout" @toggle-menu="toggleMenu" />

    <section class="fei-hero">
      <div class="fei-container fei-hero__inner">
        <div class="fei-badge">
          <span>企业级 API 开放与运营管理平台</span>
        </div>
        <h1 class="fei-hero__title">
          让接口能力<br />
          <strong>触手可及</strong>
        </h1>
        <p class="fei-hero__desc">
          FeiAPI 提供统一的接口广场、在线调试、网关转发、调用统计与后台管理，帮助开发团队快速开放能力、降低接入成本。
        </p>
        <div class="fei-actions">
          <a class="fei-btn fei-btn--primary" href="#/market">浏览接口广场</a>
          <a v-if="loginUser" class="fei-btn fei-btn--secondary" href="#/profile/records">查看我的调用</a>
          <a v-else class="fei-btn fei-btn--secondary" href="#/register">获取免费额度</a>
        </div>
      </div>
    </section>

    <div class="fei-container">
      <div class="fei-stats">
        <div v-for="item in stats" :key="item.label" class="fei-stat">
          <div class="fei-stat__value">{{ item.value }}</div>
          <div class="fei-stat__label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="fei-container fei-page">
      <div class="fei-section">
        <SectionHeader title="平台核心能力" desc="覆盖接口全生命周期，从开放、调试到运营分析一站式解决" />
        <div class="fei-grid-4" style="margin-top: 18px">
          <div v-for="item in features" :key="item.title" class="fei-feature">
            <div class="fei-icon-box">{{ item.icon }}</div>
            <h3 class="fei-section-title" style="font-size: 18px">{{ item.title }}</h3>
            <p class="fei-section-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import SectionHeader from '@/components/SectionHeader.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';
import type { UserVO } from '@/types/api';

const router = useRouter();
const loginUser = ref<UserVO | null>(null);
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

const stats = [
  { value: '6', label: '平台接口' },
  { value: '12k+', label: '今日调用' },
  { value: '99.9%', label: '服务可用性' },
  { value: '<50ms', label: '平均响应' },
];

const features = [
  { icon: '∎', title: '接口广场', desc: '统一浏览已上线接口，查看请求方法、地址、参数与状态，快速发现所需能力。' },
  { icon: '▶', title: '在线调试', desc: '登录用户可直接在详情页填写参数并发起调用，实时查看响应结果与错误信息。' },
  { icon: '⛨', title: '安全网关', desc: '基于 accessKey、secretKey、签名、随机数和时间戳完成鉴权、防重放与次数控制。' },
  { icon: '◌', title: '调用分析', desc: '管理员可查看热门接口 TOP3、用户调用关系与额度，为运营决策提供数据支撑。' },
];

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => {
    toast.visible = false;
  }, 2400);
};

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
  } catch {
    loginUser.value = null;
  }
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
    showToast('已安全退出', 'success');
    // 延迟跳转到首页，让用户看到提示
    setTimeout(() => {
      router.replace('/home');
    }, 1000);
  } catch {
    showToast('退出失败', 'error');
  }
};

const toggleMenu = () => {
  showToast('移动端菜单已保留为简洁模式', 'info');
};

onMounted(async () => {
  await loadLoginUser();
});
</script>
