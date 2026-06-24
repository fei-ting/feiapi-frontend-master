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
          <a class="fei-btn fei-btn--primary" href="#/home#interfaces">浏览接口广场</a>
          <a class="fei-btn fei-btn--secondary" href="#/profile/records">查看我的调用</a>
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

      <div id="interfaces" class="fei-section">
        <SectionHeader title="接口广场" desc="浏览并选择适合您业务的接口能力" />
        <div class="fei-filter-bar" style="margin-top: 18px">
          <button
            v-for="item in filters"
            :key="item.key"
            class="fei-btn"
            :class="item.key === currentStatus ? 'fei-btn--primary' : 'fei-btn--secondary'"
            type="button"
            @click="loadInterfaces(item.key)"
          >
            {{ item.label }}
          </button>
        </div>

        <LoadingBlock v-if="loading" />

        <div v-else-if="list.length" class="fei-grid-3">
          <article v-for="item in list" :key="item.id" class="fei-api-card">
            <div class="fei-api-card__header">
              <div>
                <h3 class="fei-api-card__title">{{ item.name }}</h3>
                <p class="fei-api-card__desc">{{ item.description }}</p>
              </div>
              <StatusTag :status="item.status" />
            </div>
            <div class="fei-meta">
              <MethodTag :method="item.method" />
              <span style="color: var(--fei-text-muted)">{{ item.url }}</span>
            </div>
            <div style="margin-top: 18px; text-align: right">
              <a class="fei-btn fei-btn--primary" :href="`#/interface/${item.id}`">查看详情</a>
            </div>
          </article>
        </div>

        <div v-else class="fei-empty fei-card" style="margin-top: 18px">当前条件下没有可展示的接口</div>
      </div>
    </div>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import SectionHeader from '@/components/SectionHeader.vue';
import LoadingBlock from '@/components/LoadingBlock.vue';
import StatusTag from '@/components/StatusTag.vue';
import MethodTag from '@/components/MethodTag.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { userService } from '@/services/user';
import type { InterfaceInfoVO, UserVO } from '@/types/api';

const loginUser = ref<UserVO | null>(null);
const loading = ref(false);
const currentStatus = ref<string | number>('');
const list = ref<InterfaceInfoVO[]>([]);
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

const filters = [
  { key: '', label: '全部' },
  { key: 1, label: '已上线' },
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

const loadInterfaces = async (status: string | number = '') => {
  currentStatus.value = status;
  loading.value = true;
  try {
    const res = await interfaceService.listPage({ current: 1, pageSize: 6, status });
    list.value = res.data?.records ?? [];
  } catch (error) {
    showToast('接口列表加载失败', 'error');
    list.value = [];
    void error;
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
    showToast('已安全退出', 'success');
  } catch {
    showToast('退出失败', 'error');
  }
};

const toggleMenu = () => {
  showToast('移动端菜单已保留为简洁模式', 'info');
};

onMounted(async () => {
  await loadLoginUser();
  await loadInterfaces('');
});
</script>
