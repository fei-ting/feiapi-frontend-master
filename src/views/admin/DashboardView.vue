<template>
  <div class="fei-dashboard">
    <!-- 欢迎语 -->
    <div class="fei-dashboard__welcome">
      <h2 class="fei-section-title">👋 欢迎回来，{{ displayName }}</h2>
      <p class="fei-section-desc">这是您的管理工作台，可以快速了解平台运行状态</p>
    </div>

    <!-- 顶部概览 -->
    <div class="fei-dashboard__overview">
      <div class="fei-overview-card">
        <div class="fei-overview-card__icon" style="background: #dbeafe; color: #2563eb">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </div>
        <div class="fei-overview-card__content">
          <div class="fei-overview-card__value">{{ overview?.totalInterfaces ?? '--' }}</div>
          <div class="fei-overview-card__label">接口总数</div>
        </div>
      </div>
      <div class="fei-overview-card">
        <div class="fei-overview-card__icon" style="background: #dcfce7; color: #16a34a">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="fei-overview-card__content">
          <div class="fei-overview-card__value">{{ overview?.onlineInterfaces ?? '--' }}</div>
          <div class="fei-overview-card__label">在线接口</div>
        </div>
      </div>
      <div class="fei-overview-card">
        <div class="fei-overview-card__icon" style="background: #f3f4f6; color: #6b7280">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </div>
        <div class="fei-overview-card__content">
          <div class="fei-overview-card__value">{{ overview?.offlineInterfaces ?? '--' }}</div>
          <div class="fei-overview-card__label">已下线接口</div>
        </div>
      </div>
      <div class="fei-overview-card">
        <div class="fei-overview-card__icon" style="background: #e0e7ff; color: #4f46e5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </div>
        <div class="fei-overview-card__content">
          <div class="fei-overview-card__value">{{ overview ? formatNumber(overview.todayInvocations) : '--' }}</div>
          <div class="fei-overview-card__label">今日调用</div>
        </div>
      </div>
      <div class="fei-overview-card">
        <div class="fei-overview-card__icon" style="background: #fef3c7; color: #d97706">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <div class="fei-overview-card__content">
          <div class="fei-overview-card__value">{{ overview?.todayErrors ?? '--' }}</div>
          <div class="fei-overview-card__label">今日错误</div>
        </div>
      </div>
      <div class="fei-overview-card">
        <div class="fei-overview-card__icon" style="background: #fee2e2; color: #dc2626">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="fei-overview-card__content">
          <div class="fei-overview-card__value">{{ overview?.abnormalInterfaces ?? '--' }}</div>
          <div class="fei-overview-card__label">异常接口</div>
        </div>
      </div>
    </div>

    <!-- 运行状态区 -->
    <div class="fei-card fei-dashboard__section">
      <div class="fei-card-header">
        <h3 class="fei-section-title">📊 运行状态（最近 24 小时）</h3>
        <!-- 趋势切换按钮 -->
        <div class="fei-trend-tabs">
          <button
            v-for="tab in trendTabs"
            :key="tab.key"
            class="fei-trend-tab"
            :class="{ 'is-active': activeTrend === tab.key }"
            @click="activeTrend = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="fei-card-body">
        <!-- 当前趋势指标说明 -->
        <div class="fei-trend-summary">
          <span class="fei-trend-summary__label">{{ currentTrendTab?.label }}</span>
          <span class="fei-trend-summary__value" :class="currentTrendTab?.valueClass">
            {{ latestTrend(activeTrend) }}{{ currentTrendTab?.unit }}
          </span>
        </div>
        <!-- 柱状图 -->
        <div class="fei-chart-wrapper">
          <!-- Y 轴标签 -->
          <div class="fei-chart-y-axis">
            <span>{{ yAxisMax }}</span>
            <span>{{ Math.round(yAxisMax / 2) }}</span>
            <span>0</span>
          </div>
          <!-- 柱状图区域 -->
          <div class="fei-chart-area">
            <div class="fei-chart-bars">
              <div
                v-for="(point, idx) in currentTrendData"
                :key="idx"
                class="fei-chart-bar-wrapper"
              >
                <div
                  class="fei-chart-bar"
                  :style="{ height: `${barHeight(point.value)}%`, background: currentTrendTab?.color }"
                  :title="`${point.label}: ${point.value}${currentTrendTab?.unit}`"
                >
                  <span class="fei-chart-bar__value">{{ point.value }}{{ currentTrendTab?.unit }}</span>
                </div>
              </div>
            </div>
            <!-- X 轴标签 -->
            <div class="fei-chart-x-axis">
              <span v-for="(point, idx) in currentTrendData" :key="idx">{{ point.label }}</span>
            </div>
          </div>
        </div>
        <!-- X 轴说明 -->
        <div class="fei-chart-x-label">时间</div>
      </div>
    </div>

    <div class="fei-dashboard__grid">
      <!-- 重点关注区 -->
      <div class="fei-card fei-dashboard__section">
        <div class="fei-card-header">
          <h3 class="fei-section-title">⚠️ 重点关注</h3>
        </div>
        <div class="fei-card-body">
          <div v-if="alerts.length" class="fei-alert-list">
            <div v-for="item in alerts" :key="item.id" class="fei-alert-item" @click="goInterface(item.id)">
              <div class="fei-alert-item__icon" :class="`fei-alert-item__icon--${item.alertType}`">
                {{ alertIcon(item.alertType) }}
              </div>
              <div class="fei-alert-item__content">
                <div class="fei-alert-item__name">{{ item.name }}</div>
                <div class="fei-alert-item__desc">{{ item.description }}</div>
              </div>
              <div class="fei-alert-item__time">{{ item.time }}</div>
            </div>
          </div>
          <div v-else class="fei-empty" style="padding: 32px">暂无告警</div>
        </div>
      </div>

      <!-- 最近变更区 -->
      <div class="fei-card fei-dashboard__section">
        <div class="fei-card-header">
          <h3 class="fei-section-title">📝 最近变更</h3>
        </div>
        <div class="fei-card-body">
          <div v-if="changes.length" class="fei-change-list">
            <div v-for="item in changes" :key="item.id" class="fei-change-item" @click="goInterface(item.id)">
              <span class="fei-change-tag" :class="`fei-change-tag--${item.changeType}`">
                {{ changeTypeText(item.changeType) }}
              </span>
              <span class="fei-change-item__name">{{ item.name }}</span>
              <span class="fei-change-item__time">{{ item.time }}</span>
            </div>
          </div>
          <div v-else class="fei-empty" style="padding: 32px">暂无变更</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作区 -->
    <div class="fei-card fei-dashboard__section">
      <div class="fei-card-header">
        <h3 class="fei-section-title">🚀 快捷操作</h3>
      </div>
      <div class="fei-card-body">
        <div class="fei-quick-actions">
          <RouterLink class="fei-quick-action" to="/admin/interfaces">
            <div class="fei-quick-action__icon" style="background: #dbeafe; color: #2563eb">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <span>管理接口</span>
          </RouterLink>
          <RouterLink class="fei-quick-action" to="/market">
            <div class="fei-quick-action__icon" style="background: #dcfce7; color: #16a34a">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <span>查看接口广场</span>
          </RouterLink>
          <button class="fei-quick-action" type="button" @click="handleRefresh">
            <div class="fei-quick-action__icon" style="background: #fef3c7; color: #d97706">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            </div>
            <span>刷新数据</span>
          </button>
          <RouterLink class="fei-quick-action" to="/home">
            <div class="fei-quick-action__icon" style="background: #e0e7ff; color: #4f46e5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <span>返回首页</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Mock 数据提示 -->
    <div v-if="dataSource === 'mock'" class="fei-dashboard__mock-tip">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <span>当前为开发模式，显示模拟数据。设置 VITE_ENABLE_MOCK=true 可启用 Mock 降级</span>
    </div>

    <!-- 接口错误提示 -->
    <div v-if="dataSource === 'error'" class="fei-dashboard__error-tip">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      <span>数据加载失败，当前未显示不可用指标。请检查后端接口状态</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { dashboardService } from '@/services/dashboard';
import { useUserStore } from '@/stores/user';
import type { DashboardOverview, DashboardTrends, AlertInterface, ChangedInterface } from '@/types/dashboard';
import type { DataSource } from '@/services/dashboardMock';

const router = useRouter();
const userStore = useUserStore();

/** 创建空趋势数据，接口失败时保持图表为空状态。 */
const createEmptyTrends = (): DashboardTrends => ({
  successRate: [],
  invocationCount: [],
  errorRate: [],
  responseTime: [],
});

/** 当前管理员显示名称 */
const displayName = computed(() => userStore.loginUser?.userName || '管理员');

/** 概览统计 */
const overview = ref<DashboardOverview | null>(null);

/** 趋势数据 */
const trends = ref<DashboardTrends>(createEmptyTrends());

/** 重点关注 */
const alerts = ref<AlertInterface[]>([]);

/** 最近变更 */
const changes = ref<ChangedInterface[]>([]);

/** 数据来源 */
const dataSource = ref<DataSource>('real');

/** 趋势 Tab 配置 */
const trendTabs = [
  { key: 'successRate' as const, label: '成功率', unit: '%', color: '#22c55e', valueClass: 'fei-trend-summary__value--success' },
  { key: 'invocationCount' as const, label: '调用量', unit: '', color: '#3b82f6', valueClass: '' },
  { key: 'errorRate' as const, label: '错误率', unit: '%', color: '#ef4444', valueClass: 'fei-trend-summary__value--danger' },
  { key: 'responseTime' as const, label: '响应时间', unit: 'ms', color: '#8b5cf6', valueClass: '' },
];

/** 当前激活的趋势类型 */
const activeTrend = ref<keyof DashboardTrends>('successRate');

/** 当前趋势 Tab 配置 */
const currentTrendTab = computed(() => trendTabs.find((t) => t.key === activeTrend.value));

/** 当前趋势数据 */
const currentTrendData = computed(() => trends.value[activeTrend.value] ?? []);

/** Y 轴最大值 */
const yAxisMax = computed(() => {
  const data = currentTrendData.value;
  if (!data.length) return 100;
  const max = Math.max(...data.map((d: { value: number }) => d.value));
  // 向上取整到合适的刻度
  if (max <= 10) return 10;
  if (max <= 100) return Math.ceil(max / 10) * 10;
  return Math.ceil(max / 100) * 100;
});

/**
 * 计算柱状图高度百分比
 */
const barHeight = (value: number): number => {
  const max = yAxisMax.value;
  return max > 0 ? (value / max) * 100 : 0;
};

/**
 * 格式化数字（超过 1000 显示为 k）
 */
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return String(num);
};

/**
 * 获取趋势最新值
 */
const latestTrend = (key: keyof DashboardTrends): string | number => {
  const data = trends.value[key];
  if (!data.length) return '-';
  return data[data.length - 1].value;
};

/**
 * 告警类型图标
 */
const alertIcon = (type: string): string => {
  const icons: Record<string, string> = {
    abnormal: '🔴',
    spike: '📈',
    highFailureRate: '⚠️',
    modified: '✏️',
    unused: '💤',
  };
  return icons[type] ?? '❓';
};

/**
 * 变更类型文本
 */
const changeTypeText = (type: string): string => {
  const texts: Record<string, string> = {
    created: '新增',
    online: '上线',
    offline: '下线',
    updated: '修改',
  };
  return texts[type] ?? type;
};

/**
 * 跳转到接口详情
 */
const goInterface = (id: number) => {
  router.push(`/interface/${id}`);
};

/**
 * 刷新数据
 */
const handleRefresh = () => {
  loadDashboard();
};

/**
 * 加载 Dashboard 数据
 */
const loadDashboard = async () => {
  overview.value = null;
  trends.value = createEmptyTrends();
  alerts.value = [];
  changes.value = [];

  try {
    const [overviewResult, trendsResult, alertsResult, changesResult] = await Promise.all([
      dashboardService.getOverview(),
      dashboardService.getTrends(),
      dashboardService.getAlerts(),
      dashboardService.getChanges(),
    ]);

    // 更新数据
    overview.value = overviewResult.data;
    trends.value = trendsResult.data ?? createEmptyTrends();
    alerts.value = alertsResult.data ?? [];
    changes.value = changesResult.data ?? [];

    // 数据来源：优先显示 error，其次 mock，最后 real
    const sources: DataSource[] = [
      overviewResult.source,
      trendsResult.source,
      alertsResult.source,
      changesResult.source,
    ];
    if (sources.includes('error')) {
      dataSource.value = 'error';
    } else if (sources.includes('mock')) {
      dataSource.value = 'mock';
    } else {
      dataSource.value = 'real';
    }
  } catch {
    dataSource.value = 'error';
  }
};

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.fei-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* ========== 概览卡片 ========== */

.fei-dashboard__overview {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.fei-overview-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  background: var(--fei-surface);
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius-md);
  box-shadow: var(--fei-shadow-soft);
}

.fei-overview-card__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.fei-overview-card__value {
  font-size: 26px;
  font-weight: 800;
  color: var(--fei-text);
  line-height: 1.2;
}

.fei-overview-card__label {
  font-size: 13px;
  color: var(--fei-text-muted);
  margin-top: 2px;
}

/* ========== 趋势图 ========== */

.fei-dashboard__section {
  overflow: hidden;
}

.fei-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.fei-trend-tabs {
  display: flex;
  gap: 4px;
  background: var(--fei-surface-soft);
  padding: 4px;
  border-radius: 10px;
}

.fei-trend-tab {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--fei-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fei-trend-tab:hover {
  color: var(--fei-text);
  background: rgba(255, 255, 255, 0.5);
}

.fei-trend-tab.is-active {
  background: var(--fei-surface);
  color: var(--fei-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.fei-trend-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.fei-trend-summary__label {
  font-size: 14px;
  color: var(--fei-text-secondary);
}

.fei-trend-summary__value {
  font-size: 24px;
  font-weight: 800;
  color: var(--fei-text);
}

.fei-trend-summary__value--success {
  color: #16a34a;
}

.fei-trend-summary__value--danger {
  color: #dc2626;
}

/* 图表区域 */
.fei-chart-wrapper {
  display: flex;
  gap: 8px;
  min-height: 240px;
}

.fei-chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 30px;
  width: 48px;
  text-align: right;
  font-size: 12px;
  color: var(--fei-text-muted);
  flex-shrink: 0;
}

.fei-chart-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fei-chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 0 8px;
  border-left: 1px solid var(--fei-border);
  border-bottom: 1px solid var(--fei-border);
}

.fei-chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.fei-chart-bar {
  width: 20%;
  min-width: 16px;
  max-width: 40px;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  cursor: pointer;
  position: relative;
}

.fei-chart-bar:hover {
  opacity: 0.85;
  transform: scaleX(1.02);
}

.fei-chart-bar__value {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--fei-text-secondary);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.fei-chart-bar:hover .fei-chart-bar__value {
  opacity: 1;
}

.fei-chart-x-axis {
  display: flex;
  gap: 12px;
  padding: 8px 8px 0;
}

.fei-chart-x-axis span {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--fei-text-muted);
}

.fei-chart-x-label {
  text-align: center;
  font-size: 12px;
  color: var(--fei-text-muted);
  margin-top: 8px;
}

/* ========== 重点关注 ========== */

.fei-dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.fei-alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fei-alert-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--fei-surface-soft);
  border-radius: var(--fei-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.fei-alert-item:hover {
  background: var(--fei-primary-light);
}

.fei-alert-item__icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 18px;
  flex-shrink: 0;
}

.fei-alert-item__icon--abnormal {
  background: #fee2e2;
}

.fei-alert-item__icon--spike {
  background: #dbeafe;
}

.fei-alert-item__icon--highFailureRate {
  background: #fef3c7;
}

.fei-alert-item__icon--modified {
  background: #e0e7ff;
}

.fei-alert-item__icon--unused {
  background: #f3f4f6;
}

.fei-alert-item__content {
  flex: 1;
  min-width: 0;
}

.fei-alert-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--fei-text);
}

.fei-alert-item__desc {
  font-size: 12px;
  color: var(--fei-text-muted);
  margin-top: 2px;
}

.fei-alert-item__time {
  font-size: 12px;
  color: var(--fei-text-muted);
  flex-shrink: 0;
}

/* ========== 最近变更 ========== */

.fei-change-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fei-change-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--fei-surface-soft);
  border-radius: var(--fei-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.fei-change-item:hover {
  background: var(--fei-primary-light);
}

.fei-change-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.fei-change-tag--created {
  background: #dbeafe;
  color: #2563eb;
}

.fei-change-tag--online {
  background: #dcfce7;
  color: #16a34a;
}

.fei-change-tag--offline {
  background: #f3f4f6;
  color: #6b7280;
}

.fei-change-tag--updated {
  background: #fef3c7;
  color: #d97706;
}

.fei-change-item__name {
  flex: 1;
  font-size: 14px;
  color: var(--fei-text);
}

.fei-change-item__time {
  font-size: 12px;
  color: var(--fei-text-muted);
  flex-shrink: 0;
}

/* ========== 快捷操作 ========== */

.fei-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.fei-quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: var(--fei-surface-soft);
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius-md);
  text-decoration: none;
  color: var(--fei-text);
  transition: all 0.2s ease;
}

.fei-quick-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--fei-shadow);
  border-color: var(--fei-primary-light);
  color: var(--fei-primary);
}

.fei-quick-action__icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
}

.fei-quick-action span {
  font-size: 14px;
  font-weight: 600;
}

/* ========== Mock 提示 ========== */

.fei-dashboard__mock-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--fei-radius-sm);
  font-size: 13px;
  color: #92400e;
}

.fei-dashboard__mock-tip svg {
  flex-shrink: 0;
  color: #d97706;
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

/* ========== 响应式 ========== */

@media (max-width: 1100px) {
  .fei-dashboard__overview {
    grid-template-columns: repeat(3, 1fr);
  }

  .fei-dashboard__grid {
    grid-template-columns: 1fr;
  }

  .fei-quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .fei-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .fei-dashboard__overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .fei-quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .fei-trend-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .fei-chart-wrapper {
    min-height: 200px;
  }

  .fei-chart-x-axis span {
    font-size: 10px;
  }
}
</style>
