<template>
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
        <RouterLink class="fei-btn fei-btn--primary" to="/market">浏览接口广场</RouterLink>
        <RouterLink v-if="loginUser" class="fei-btn fei-btn--secondary" to="/profile/records">查看我的调用</RouterLink>
        <RouterLink v-else class="fei-btn fei-btn--secondary" to="/register">获取免费额度</RouterLink>
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
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SectionHeader from '@/components/SectionHeader.vue';
import { homeStatsService } from '@/services/homeStats';
import { useUserStore } from '@/stores/user';
import type { UserVO } from '@/types/api';
import type { HomeStats } from '@/types/home';

/**
 * 首页组件
 * 展示平台核心能力和统计数据
 */

const userStore = useUserStore();

/** 当前登录用户 */
const loginUser = ref<UserVO | null>(null);

/** 统计数据 */
const stats = ref([
  { value: '--', label: '平台接口' },
  { value: '--', label: '累计调用' },
  { value: '--', label: '成功率' },
  { value: '--', label: '平均耗时' },
]);

/** 平台核心能力列表 */
const features = [
  { icon: '∎', title: '接口广场', desc: '统一浏览已上线接口，查看请求方法、地址、参数与状态，快速发现所需能力。' },
  { icon: '▶', title: '在线调试', desc: '登录用户可直接在详情页填写参数并发起调用，实时查看响应结果与错误信息。' },
  { icon: '⛨', title: '安全网关', desc: '基于 accessKey、secretKey、签名、随机数和时间戳完成鉴权、防重放与次数控制。' },
  { icon: '◌', title: '调用分析', desc: '管理员可查看热门接口 TOP3、用户调用关系与额度，为运营决策提供数据支撑。' },
];

/**
 * 格式化数量显示
 * @param num 数量
 * @returns 格式化后的字符串
 */
const formatCount = (num: number | null | undefined): string => {
  if (num == null) {
    return '--';
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}万`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(num);
};

/**
 * 格式化比率显示
 * @param rate 比率
 * @returns 格式化后的字符串
 */
const formatRate = (rate: number | null | undefined): string => {
  if (rate == null) {
    return '--';
  }
  return `${rate.toFixed(1).replace(/\.0$/, '')}%`;
};

/**
 * 格式化响应时间显示
 * @param responseTimeMs 响应时间（毫秒）
 * @returns 格式化后的字符串
 */
const formatResponseTime = (responseTimeMs: number | null | undefined): string => {
  if (responseTimeMs == null) {
    return '--';
  }
  return `${Math.round(responseTimeMs)}ms`;
};

/**
 * 更新统计数据
 * @param homeStats 首页统计数据
 */
const updateStats = (homeStats: HomeStats) => {
  stats.value = [
    { value: formatCount(homeStats.platformInterfaceCount), label: '平台接口' },
    { value: formatCount(homeStats.totalInvocations), label: '累计调用' },
    { value: formatRate(homeStats.successRate), label: '成功率' },
    { value: formatResponseTime(homeStats.averageResponseTimeMs), label: '平均耗时' },
  ];
};

/**
 * 加载首页统计数据
 */
const loadHomeStats = async () => {
  try {
    const data = await homeStatsService.getHomeStats();
    if (data) {
      updateStats(data);
    }
  } catch {
    stats.value = [
      { value: '--', label: '平台接口' },
      { value: '--', label: '累计调用' },
      { value: '--', label: '成功率' },
      { value: '--', label: '平均耗时' },
    ];
  }
};

onMounted(async () => {
  // 从 Store 获取登录用户
  loginUser.value = userStore.loginUser;
  await loadHomeStats();
});
</script>
