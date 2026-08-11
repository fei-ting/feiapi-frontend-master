<template>
  <div class="fei-dashboard" :aria-busy="loading">
    <div class="fei-dashboard__welcome">
      <h2 class="fei-section-title">👋 欢迎回来，{{ displayName }}</h2>
      <p class="fei-section-desc">这是您的管理工作台，可以快速了解平台运行状态</p>
    </div>

    <OverviewCards :overview="overview" />
    <TrendChart v-model:active-trend="activeTrend" :trends="trends" />

    <div class="fei-dashboard__grid">
      <AlertList :alerts="alerts" @select-interface="goInterface" />
      <ChangeList :changes="changes" @select-interface="goInterface" />
    </div>

    <QuickActions @refresh="handleRefresh" />

    <div v-if="failedSections.length" class="fei-dashboard__error-tip">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      <span>{{ failedSections.join('、') }}加载失败，当前未显示不可用指标。请检查后端接口状态后刷新</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AlertList from '@/components/dashboard/AlertList.vue';
import ChangeList from '@/components/dashboard/ChangeList.vue';
import OverviewCards from '@/components/dashboard/OverviewCards.vue';
import QuickActions from '@/components/dashboard/QuickActions.vue';
import TrendChart from '@/components/dashboard/TrendChart.vue';
import { dashboardService } from '@/services/dashboard';
import { useUserStore } from '@/stores/user';
import type { AlertInterface, ChangedInterface, DashboardOverview, DashboardTrends } from '@/types/dashboard';

const router = useRouter();
const userStore = useUserStore();

/** 创建空趋势数据，接口失败时保持图表为空状态。 */
const createEmptyTrends = (): DashboardTrends => ({
  successRate: [],
  invocationCount: [],
  errorRate: [],
  responseTime: [],
});

/** 当前管理员显示名称。 */
const displayName = computed(() => userStore.loginUser?.userName || '管理员');

/** 概览统计。 */
const overview = ref<DashboardOverview | null>(null);

/** 趋势数据。 */
const trends = ref<DashboardTrends>(createEmptyTrends());

/** 重点关注接口。 */
const alerts = ref<AlertInterface[]>([]);

/** 最近变更接口。 */
const changes = ref<ChangedInterface[]>([]);

/** 工作台是否正在加载。 */
const loading = ref(false);

/** 加载失败的区块名称。 */
const failedSections = ref<string[]>([]);

/** 当前激活的趋势类型。 */
const activeTrend = ref<keyof DashboardTrends>('successRate');

/**
 * 跳转到接口详情。
 *
 * @param id 接口 ID
 */
const goInterface = (id: number): void => {
  router.push(`/interface/${id}`);
};

/** 刷新工作台数据。 */
const handleRefresh = (): void => {
  void loadDashboard();
};

/** 加载四个工作台真实数据区块。 */
const loadDashboard = async (): Promise<void> => {
  loading.value = true;
  failedSections.value = [];
  overview.value = null;
  trends.value = createEmptyTrends();
  alerts.value = [];
  changes.value = [];

  const results = await Promise.allSettled([
    dashboardService.getOverview(),
    dashboardService.getTrends(),
    dashboardService.getAlerts(),
    dashboardService.getChanges(),
  ]);
  const [overviewResult, trendsResult, alertsResult, changesResult] = results;
  if (overviewResult.status === 'rejected') failedSections.value.push('概览统计');
  else overview.value = overviewResult.value;
  if (trendsResult.status === 'rejected') failedSections.value.push('运行趋势');
  else trends.value = trendsResult.value;
  if (alertsResult.status === 'rejected') failedSections.value.push('重点关注');
  else alerts.value = alertsResult.value;
  if (changesResult.status === 'rejected') failedSections.value.push('最近变更');
  else changes.value = changesResult.value;
  loading.value = false;
};

onMounted(() => {
  void loadDashboard();
});
</script>

<style scoped>
.fei-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fei-dashboard[aria-busy='true'] {
  opacity: 0.72;
  transition: opacity 0.2s ease;
}

.fei-dashboard__welcome {
  padding: 20px 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: var(--fei-radius-lg);
  border: 1px solid #bfdbfe;
}

.fei-dashboard__welcome .fei-section-title {
  font-size: 20px;
  margin-bottom: 4px;
}

.fei-dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.fei-dashboard__error-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--fei-radius-sm);
  font-size: 13px;
  color: #991b1b;
}

.fei-dashboard__error-tip svg {
  flex-shrink: 0;
  color: #dc2626;
}

@media (max-width: 1100px) {
  .fei-dashboard__grid {
    grid-template-columns: 1fr;
  }
}
</style>
