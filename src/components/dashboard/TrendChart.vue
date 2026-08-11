<template>
  <div class="fei-card fei-dashboard__section">
    <div class="fei-card-header">
      <h3 class="fei-section-title">📊 运行状态（最近 8 小时）</h3>
      <div class="fei-trend-tabs">
        <button
          v-for="tab in trendTabs"
          :key="tab.key"
          class="fei-trend-tab"
          :class="{ 'is-active': props.activeTrend === tab.key }"
          @click="changeActiveTrend(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    <div class="fei-card-body">
      <div class="fei-trend-summary">
        <span class="fei-trend-summary__label">{{ currentTrendTab?.label }}</span>
        <span class="fei-trend-summary__value" :class="currentTrendTab?.valueClass">
          {{ latestTrend }}{{ currentTrendTab?.unit }}
        </span>
      </div>
      <div v-if="currentTrendData.length" class="fei-chart-wrapper">
        <div class="fei-chart-y-axis">
          <span>{{ yAxisMax }}</span>
          <span>{{ Math.round(yAxisMax / 2) }}</span>
          <span>0</span>
        </div>
        <div class="fei-chart-area">
          <div class="fei-chart-bars">
            <div
              v-for="(point, index) in currentTrendData"
              :key="index"
              class="fei-chart-bar-wrapper"
            >
              <div
                class="fei-chart-bar"
                :style="{ height: `${barHeight(point.value)}%`, background: currentTrendTab?.color }"
                :title="`${formatFullTrendTime(point.time)}: ${point.value}${currentTrendTab?.unit}`"
              >
                <span class="fei-chart-bar__value">{{ point.value }}{{ currentTrendTab?.unit }}</span>
              </div>
            </div>
          </div>
          <div class="fei-chart-x-axis">
            <span
              v-for="(point, index) in currentTrendData"
              :key="index"
              :title="formatFullTrendTime(point.time)"
            >
              {{ formatTrendTime(point.time) }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="fei-empty fei-trend-empty">最近8小时暂无调用数据</div>
      <div class="fei-chart-x-label">时间</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardTrends, TrendPoint } from '@/types/dashboard';

/** 趋势图组件属性。 */
interface TrendChartProps {
  /** Dashboard 趋势数据。 */
  trends: DashboardTrends;
  /** 当前激活的趋势类型。 */
  activeTrend: keyof DashboardTrends;
}

/** 趋势图组件事件。 */
interface TrendChartEmits {
  /** 切换当前趋势类型。 */
  (event: 'update:activeTrend', key: keyof DashboardTrends): void;
}

/** 趋势标签展示配置。 */
interface TrendTabConfig {
  /** 趋势数据键。 */
  key: keyof DashboardTrends;
  /** 趋势展示名称。 */
  label: string;
  /** 数值单位。 */
  unit: string;
  /** 柱状图颜色。 */
  color: string;
  /** 数值强调样式。 */
  valueClass: string;
}

const props = defineProps<TrendChartProps>();
const emit = defineEmits<TrendChartEmits>();

/** 固定趋势展示配置。 */
const trendTabs: TrendTabConfig[] = [
  { key: 'successRate', label: '成功率', unit: '%', color: '#22c55e', valueClass: 'fei-trend-summary__value--success' },
  { key: 'invocationCount', label: '调用量', unit: '', color: '#3b82f6', valueClass: '' },
  { key: 'errorRate', label: '错误率', unit: '%', color: '#ef4444', valueClass: 'fei-trend-summary__value--danger' },
  { key: 'responseTime', label: '响应时间', unit: 'ms', color: '#8b5cf6', valueClass: '' },
];

/** 当前趋势标签配置。 */
const currentTrendTab = computed(() => trendTabs.find((tab) => tab.key === props.activeTrend));

/** 当前趋势数据点。 */
const currentTrendData = computed<TrendPoint[]>(() => props.trends[props.activeTrend] ?? []);

/** 当前趋势 Y 轴最大值。 */
const yAxisMax = computed(() => {
  if (!currentTrendData.value.length) {
    return 100;
  }
  const max = Math.max(...currentTrendData.value.map((point) => point.value));
  if (max <= 10) {
    return 10;
  }
  if (max <= 100) {
    return Math.ceil(max / 10) * 10;
  }
  return Math.ceil(max / 100) * 100;
});

/** 当前趋势的最新值。 */
const latestTrend = computed<string | number>(() => {
  const trendData = currentTrendData.value;
  const latestPoint = trendData[trendData.length - 1];
  return latestPoint?.value ?? '-';
});

/**
 * 计算柱状图高度百分比。
 *
 * @param value 趋势数值
 * @returns 相对 Y 轴最大值的高度百分比
 */
const barHeight = (value: number): number => (
  yAxisMax.value > 0 ? (value / yAxisMax.value) * 100 : 0
);

/**
 * 将标准时间格式化为趋势横轴时间。
 *
 * @param time 标准时间
 * @returns 月日和时分组成的横轴时间
 */
const formatTrendTime = (time: string): string => formatTime(time, false);

/**
 * 将标准时间格式化为完整悬停时间。
 *
 * @param time 标准时间
 * @returns 包含年月日和时分秒的完整时间
 */
const formatFullTrendTime = (time: string): string => formatTime(time, true);

/**
 * 按浏览器所在时区格式化标准时间，解析失败时保留后端原始值。
 *
 * @param time 标准时间
 * @param includeYear 是否包含年份和秒
 * @returns 格式化后的时间
 */
const formatTime = (time: string, includeYear: boolean): string => {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return time;
  }
  const pad = (value: number): string => String(value).padStart(2, '0');
  const datePart = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return includeYear
    ? `${date.getFullYear()}-${datePart} ${timePart}:${pad(date.getSeconds())}`
    : `${datePart} ${timePart}`;
};

/**
 * 通知父页面切换趋势类型。
 *
 * @param key 目标趋势类型
 */
const changeActiveTrend = (key: keyof DashboardTrends): void => {
  emit('update:activeTrend', key);
};
</script>

<style scoped>
.fei-dashboard__section {
  overflow: hidden;
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
  white-space: nowrap;
}

.fei-chart-x-label {
  text-align: center;
  font-size: 12px;
  color: var(--fei-text-muted);
  margin-top: 8px;
}

.fei-trend-empty {
  min-height: 240px;
  display: grid;
  place-items: center;
}

@media (max-width: 1100px) {
  .fei-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .fei-trend-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .fei-chart-wrapper {
    min-height: 200px;
    overflow-x: auto;
  }

  .fei-chart-area {
    min-width: 560px;
  }

  .fei-chart-x-axis span {
    font-size: 10px;
  }
}
</style>
