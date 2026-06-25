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
          <a class="fei-btn fei-btn--primary" href="#/home" @click="scrollToInterfaces">浏览接口广场</a>
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

      <div id="interfaces" class="fei-section">
        <!-- 标题 + 搜索框同行 -->
        <div class="fei-market-header">
          <div>
            <h2 class="fei-market-title">接口广场</h2>
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
            @click="goDetail(item.id)"
          >
            <div class="fei-api-card__header">
              <div>
                <h3 class="fei-api-card__title">{{ item.name }}</h3>
                <span class="fei-method-badge">{{ item.method }}</span>
              </div>
              <StatusTag :status="item.status" />
            </div>
            <p class="fei-api-card__desc">{{ item.description }}</p>
            <div class="fei-api-card__meta">
              <span class="fei-api-card__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                {{ item.path }}
              </span>
              <span class="fei-api-card__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                {{ item.totalNum ?? 0 }}
              </span>
            </div>
          </article>
        </div>

        <div v-else class="fei-empty fei-card" style="margin-top: 18px">当前条件下没有可展示的接口</div>

        <!-- 分页 -->
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
import ToastMessage from '@/components/ToastMessage.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { userService } from '@/services/user';
import type { InterfaceInfoVO, UserVO } from '@/types/api';

const loginUser = ref<UserVO | null>(null);
const loading = ref(false);
const list = ref<InterfaceInfoVO[]>([]);
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

/**
 * 加载接口列表
 * @param page 页码
 * @param description 搜索关键词（模糊匹配接口描述）
 */
const loadInterfaces = async (page = 1, description = '') => {
  loading.value = true;
  currentPage.value = page;
  try {
    const res = await interfaceService.listPage({ current: page, pageSize, status: 1, description });
    list.value = res.data?.records ?? [];
    total.value = res.data?.total ?? 0;
  } catch {
    showToast('接口列表加载失败', 'error');
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

/** 切换页码 */
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  loadInterfaces(page, searchKeyword.value);
  document.getElementById('interfaces')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** 搜索输入防抖处理 */
const onSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    loadInterfaces(1, searchKeyword.value);
  }, 300);
};

/** 跳转到接口详情 */
const goDetail = (id: number) => {
  window.location.hash = `#/interface/${id}`;
};

/** 平滑滚动到接口广场区域 */
const scrollToInterfaces = (e: Event) => {
  e.preventDefault();
  document.getElementById('interfaces')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  await loadInterfaces();
});
</script>
