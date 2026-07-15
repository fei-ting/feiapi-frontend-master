<template>
  <section id="interfaces" class="fei-section fei-section--compact">
    <div class="fei-market-header">
      <div>
        <h1 class="fei-market-title">接口广场</h1>
        <p class="fei-section-desc" style="margin-top: 6px">浏览并选择适合您业务的接口能力</p>
      </div>
      <div class="fei-search-bar fei-search-bar--compact">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索接口"
          @input="onSearchInput"
        />
      </div>
    </div>

    <LoadingBlock v-if="loading" />

    <div v-else-if="list.length" class="fei-card-grid">
      <article
        v-for="item in list"
        :key="item.id"
        class="fei-api-card fei-api-card--v2"
        tabindex="0"
        :aria-label="`查看接口：${interfaceDisplayName(item)}`"
        @click="goDetail(item.id)"
        @keydown.enter="goDetail(item.id)"
      >
        <div class="fei-api-card__header">
          <div class="fei-api-card__identity">
            <div class="fei-api-card__icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 17.5 10 20l10-8-6-2.5"></path>
                <path d="M4 12.5 10 15l10-8-10-3-6 4.5 6 2.5"></path>
              </svg>
            </div>
            <div class="fei-api-card__heading">
              <h2 class="fei-api-card__title">{{ interfaceDisplayName(item) }}</h2>
            </div>
          </div>
          <div class="fei-api-card__tag-stack">
            <StatusTag :status="item.status" />
            <span class="fei-tag" :class="getQuotaTagClass(item.quotaType)">
              {{ getQuotaTypeText(item.quotaType, item.quotaTypeText) }}
            </span>
          </div>
        </div>

        <div class="fei-api-card__body">
          <p class="fei-api-card__desc">{{ interfaceSummary(item) }}</p>
        </div>

        <div class="fei-api-card__footer">
          <div class="fei-api-card__meta">
            <span class="fei-method-badge">{{ methodText(item) }}</span>
            <span class="fei-api-card__meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              调用 {{ item.totalNum ?? 0 }} 次
            </span>
          </div>
          <span class="fei-api-card__action" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </span>
        </div>
      </article>
    </div>

    <div v-else class="fei-empty fei-card" style="margin-top: 18px">当前条件下没有可展示的接口</div>

    <div v-if="totalPages > 1" class="fei-pagination">
      <button
        class="fei-pagination__btn"
        :disabled="currentPage <= 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <template v-for="p in paginationRange" :key="p">
        <span v-if="p === '...'" class="fei-pagination__ellipsis">...</span>
        <button
          v-else
          class="fei-pagination__btn"
          :class="{ 'is-active': p === currentPage }"
          @click="changePage(p as number)"
        >
          {{ p }}
        </button>
      </template>
      <button
        class="fei-pagination__btn"
        :disabled="currentPage >= totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import LoadingBlock from '@/components/LoadingBlock.vue';
import StatusTag from '@/components/StatusTag.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { useUserStore } from '@/stores/user';
import { useQuota } from '@/composables/useQuota';
import type { InterfaceInfoVO } from '@/types/api';

/**
 * 接口广场页面组件
 * 展示已上线的接口列表，支持搜索和分页
 */

const userStore = useUserStore();
const { isFreeUnlimited, getQuotaTagClass, getQuotaTypeText } = useQuota();

/** 接口列表 */
const list = ref<InterfaceInfoVO[]>([]);

/** 加载状态 */
const loading = ref(false);

/** 搜索关键词 */
const searchKeyword = ref('');

/** 防抖定时器 */
let searchTimer: ReturnType<typeof setTimeout> | null = null;

/** 当前页码 */
const currentPage = ref(1);

/** 每页条数 */
const pageSize = 6;

/** 总记录数 */
const total = ref(0);

/** 总页数 */
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

/**
 * 计算分页按钮显示范围
 * 最多显示 5 个页码按钮，首尾页固定，中间用省略号连接
 */
const paginationRange = computed(() => {
  const pages: (number | string)[] = [];
  const tp = totalPages.value;
  const cp = currentPage.value;

  if (tp <= 5) {
    for (let i = 1; i <= tp; i++) pages.push(i);
  } else {
    pages.push(1);
    if (cp > 3) pages.push('...');
    const start = Math.max(2, cp - 1);
    const end = Math.min(tp - 1, cp + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (cp < tp - 2) pages.push('...');
    pages.push(tp);
  }
  return pages;
});

/**
 * 获取接口显示名称
 * @param item 接口信息
 * @returns 接口显示名称
 */
const interfaceDisplayName = (item: InterfaceInfoVO) => item.name || item.description || '未命名接口';

/**
 * 获取接口摘要
 * @param item 接口信息
 * @returns 接口摘要
 */
const interfaceSummary = (item: InterfaceInfoVO) => item.description || '暂无接口描述';

/**
 * 获取请求方法文本
 * @param item 接口信息
 * @returns 请求方法文本
 */
const methodText = (item: InterfaceInfoVO) => (item.method || 'GET').toUpperCase();

/**
 * 加载接口列表
 * @param page 页码
 * @param description 搜索关键词（模糊匹配接口描述）
 */
const loadInterfaces = async (page = 1, description = '') => {
  loading.value = true;
  currentPage.value = page;
  try {
    const data = await interfaceService.listPage({ current: page, pageSize, status: 1, description });
    list.value = data?.records ?? [];
    total.value = data?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

/**
 * 切换页码
 * @param page 页码
 */
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  loadInterfaces(page, searchKeyword.value);
  document.getElementById('interfaces')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * 搜索输入防抖处理
 */
const onSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    loadInterfaces(1, searchKeyword.value);
  }, 300);
};

/**
 * 跳转到接口详情
 * @param id 接口ID
 */
const goDetail = (id: number) => {
  window.location.hash = `#/interface/${id}`;
};

onMounted(async () => {
  await loadInterfaces();
});
</script>
