<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="profile" @logout="handleLogout" />
    <PageContainer>
      <!-- 个人信息头部卡片 -->
      <div v-if="loginUser" class="fei-profile-header">
        <img
          class="fei-profile-avatar"
          :src="loginUser.userAvatar || defaultAvatar"
          :alt="loginUser.userName || '用户'"
        />
        <div class="fei-profile-info">
          <h1 class="fei-profile-name">{{ loginUser.userName || '未设置昵称' }}</h1>
          <p class="fei-profile-account">账号：{{ loginUser.userAccount }}</p>
          <div class="fei-profile-meta">
            <span class="fei-user-role-badge">
              {{ loginUser.userRole === 'admin' ? '管理员' : '普通用户' }}
            </span>
            <span>ID: {{ loginUser.id }}</span>
            <span>性别：{{ genderText }}</span>
          </div>
        </div>
      </div>

      <!-- 侧边栏 + 内容区布局 -->
      <div class="fei-admin-layout">
        <!-- 桌面端侧边栏 -->
        <aside class="fei-admin-sidebar">
          <div class="fei-card">
            <nav class="fei-admin-sidebar-nav" style="padding: 8px">
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'info' }"
                href="#/profile/info"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                个人信息
              </a>
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'records' }"
                href="#/profile/records"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                我的额度/调用
              </a>
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'keys' }"
                href="#/profile/keys"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                密钥管理
              </a>
            </nav>
          </div>
        </aside>

        <!-- 内容区 -->
        <div class="fei-admin-content">
          <!-- 移动端 Tab 导航 -->
          <div class="fei-admin-tabs">
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'info' }"
              @click="switchTab('info')"
            >
              个人信息
            </button>
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'records' }"
              @click="switchTab('records')"
            >
              我的额度/调用
            </button>
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'keys' }"
              @click="switchTab('keys')"
            >
              密钥管理
            </button>
          </div>

          <!-- 个人信息 -->
          <div v-if="activeTab === 'info'" class="fei-card">
            <div class="fei-card-header">
              <div>
                <h2 class="fei-section-title">修改个人信息</h2>
              </div>
            </div>
            <div class="fei-card-body">
              <div class="fei-profile-form-grid">
                <section class="fei-profile-form-section">
                  <h3 class="fei-profile-form-title">基础资料</h3>
                  <form class="fei-form" @submit.prevent="handleProfileSubmit">
                    <label class="fei-field">
                      <span class="fei-label">昵称</span>
                      <input
                        v-model.trim="profileForm.userName"
                        class="fei-input"
                        :class="{ 'fei-input--error': Boolean(nicknameError) }"
                        maxlength="16"
                        placeholder="请输入昵称"
                        autocomplete="nickname"
                      />
                      <span v-if="nicknameError" class="fei-field-error">{{ nicknameError }}</span>
                    </label>
                    <label class="fei-field">
                      <span class="fei-label">性别</span>
                      <select v-model.number="profileForm.gender" class="fei-select">
                        <option :value="0">男</option>
                        <option :value="1">女</option>
                      </select>
                    </label>
                    <div class="fei-toolbar">
                      <button
                        class="fei-btn fei-btn--primary"
                        type="submit"
                        :disabled="profileSubmitting || Boolean(nicknameError)"
                      >
                        {{ profileSubmitting ? '修改中' : '修改资料' }}
                      </button>
                    </div>
                  </form>
                </section>

                <section class="fei-profile-form-section">
                  <h3 class="fei-profile-form-title">修改密码</h3>
                  <form class="fei-form" @submit.prevent="handlePasswordSubmit">
                    <label class="fei-field">
                      <span class="fei-label">旧密码</span>
                      <input
                        v-model="passwordForm.oldPassword"
                        class="fei-input"
                        type="password"
                        placeholder="请输入旧密码"
                        autocomplete="current-password"
                      />
                    </label>
                    <label class="fei-field">
                      <span class="fei-label">新密码</span>
                      <input
                        v-model="passwordForm.newPassword"
                        class="fei-input"
                        type="password"
                        placeholder="8-16位字母和数字"
                        autocomplete="new-password"
                      />
                    </label>
                    <label class="fei-field">
                      <span class="fei-label">确认密码</span>
                      <input
                        v-model="passwordForm.checkPassword"
                        class="fei-input"
                        type="password"
                        placeholder="请再次输入新密码"
                        autocomplete="new-password"
                      />
                    </label>
                    <div class="fei-toolbar">
                      <button class="fei-btn fei-btn--primary" type="submit" :disabled="passwordSubmitting">
                        {{ passwordSubmitting ? '修改中' : '修改密码' }}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </div>
          </div>

          <!-- 我的额度与调用记录 -->
          <div v-else-if="activeTab === 'records'" class="fei-card">
            <div class="fei-card-header">
              <div>
                <h2 class="fei-section-title">我的额度/调用</h2>
                <p class="fei-section-desc" style="margin-top: 6px">按接口展示已获得额度、剩余额度和累计调用次数</p>
              </div>
            </div>
            <div class="fei-table-wrap" style="border: none; border-radius: 0">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>接口名称</th>
                    <th>接口路径</th>
                    <th>配额类型</th>
                    <th>剩余额度</th>
                    <th>总调用次数</th>
                    <th>接口状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in records" :key="item.interfaceInfoId || item.id">
                    <td>
                      <div class="fei-quota-name">{{ item.interfaceName || '未命名接口' }}</div>
                      <MethodTag :method="item.method" />
                    </td>
                    <td>
                      <span class="fei-code-inline">{{ item.interfacePath || '-' }}</span>
                    </td>
                    <td>
                      <span class="fei-tag" :class="quotaTagClass(item.quotaType)">
                        {{ quotaTypeText(item) }}
                      </span>
                    </td>
                    <td>
                      <span class="fei-quota-value">{{ quotaLeftText(item) }}</span>
                    </td>
                    <td>{{ item.totalNum ?? 0 }}</td>
                    <td>
                      <span
                        class="fei-tag"
                        :class="{
                          'fei-tag--online': item.interfaceStatus === 1,
                          'fei-tag--publishing': item.interfaceStatus === 2,
                          'fei-tag--offline': item.interfaceStatus !== 1 && item.interfaceStatus !== 2,
                        }"
                      >
                        {{ interfaceStatusText(item.interfaceStatus) }}
                      </span>
                    </td>
                    <td>
                      <div class="fei-table-actions">
                        <a
                          v-if="item.interfaceStatus === 1 && item.interfaceInfoId"
                          :href="`#/interface/${item.interfaceInfoId}`"
                        >
                          去调用
                        </a>
                        <span v-else class="fei-muted-action">暂不可调用</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!records.length" class="fei-empty">暂无可展示额度</div>
          </div>

          <!-- 密钥管理 -->
          <div v-else class="fei-card">
            <div class="fei-card-header">
              <h2 class="fei-section-title">访问密钥</h2>
            </div>
            <div v-if="loginUser" class="fei-card-body">
              <!-- 安全提示 -->
              <div class="fei-security-notice">
                <div class="fei-security-notice-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <div class="fei-security-notice-title">安全提示</div>
                  <p class="fei-security-notice-text">
                    请妥善保管您的 secretKey，不要泄露给他人或在客户端代码中硬编码。如怀疑泄露，请立即重置。
                  </p>
                </div>
              </div>

              <!-- Access Key -->
              <div class="fei-key-card">
                <span class="fei-key-label">Access Key</span>
                <span class="fei-key-value">{{ userKeys?.accessKey || keyPlaceholder }}</span>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copyKey(userKeys?.accessKey || '')">
                  复制
                </button>
              </div>

              <!-- Secret Key -->
              <div class="fei-key-card" style="margin-top: 12px">
                <span class="fei-key-label">Secret Key</span>
                <span class="fei-key-value">{{ showSecret ? (userKeys?.secretKey || keyPlaceholder) : maskedSecret }}</span>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="showSecret = !showSecret">
                  {{ showSecret ? '隐藏' : '显示' }}
                </button>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copyKey(userKeys?.secretKey || '')">
                  复制
                </button>
              </div>

              <!-- SDK 接入示例 -->
              <div class="fei-sdk-snippet">
                <div class="fei-sdk-snippet__header">
                  <h3 class="fei-sdk-snippet__title">Java SDK 快速接入</h3>
                  <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copySdkSnippet">
                    复制
                  </button>
                </div>
                <pre class="fei-code" style="margin: 0">{{ sdkSnippet }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import MethodTag from '@/components/MethodTag.vue';
import { userService } from '@/services/user';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import { useUserStore } from '@/stores/user';
import type { UserInterfaceInfoVO, UserKeyVO, UserVO } from '@/types/api';

type ProfileTab = 'info' | 'records' | 'keys';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const activeTab = computed<ProfileTab>(() => {
  const tab = route.params.tab;
  if (tab === 'info' || tab === 'keys' || tab === 'records') {
    return tab;
  }
  return 'records';
});
const loginUser = ref<UserVO | null>(null);
const userKeys = ref<UserKeyVO | null>(null);
const records = ref<UserInterfaceInfoVO[]>([]);
const showSecret = ref(false);
const userKeysLoading = ref(false);
const profileSubmitting = ref(false);
const passwordSubmitting = ref(false);
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=feiapi';
const keyPlaceholder = '密钥加载中';
const passwordPattern = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{8,16}$/;
const nicknamePattern = /^[\u4e00-\u9fffA-Za-z0-9]{2,16}$/;
const nicknameSensitiveWords = [
  'admin',
  'root',
  '管理员',
  '系统',
  '官方',
  '客服',
  'feiapi',
  '色情',
  '赌博',
  '毒品',
];

const profileForm = reactive({
  userName: '',
  gender: 0,
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
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
  window.setTimeout(() => { toast.visible = false; }, 2400);
};

const maskedSecret = computed(() => {
  const secret = userKeys.value?.secretKey || '';
  if (!secret) return keyPlaceholder;
  return `${secret.slice(0, 8)}${'•'.repeat(Math.max(secret.length - 12, 4))}${secret.slice(-4)}`;
});

const genderText = computed(() => {
  if (loginUser.value?.gender === 0) return '男';
  if (loginUser.value?.gender === 1) return '女';
  return '未设置';
});

const nicknameError = computed(() => {
  const userName = profileForm.userName.trim();
  const normalizedUserName = userName.toLowerCase();
  if (!userName) {
    return '请输入昵称';
  }
  if (userName.length < 2 || userName.length > 16) {
    return '昵称需为 2-16 位';
  }
  if (!nicknamePattern.test(userName)) {
    return '昵称只能包含中文、英文和数字';
  }
  if (nicknameSensitiveWords.some((word) => normalizedUserName.includes(word))) {
    return '昵称包含不允许使用的内容';
  }
  return '';
});

const sdkSnippet = `FeiApiClient client = new FeiApiClient(\n    "<your-access-key>",\n    "<your-secret-key>"\n);\nString result = client.invoke(\n    "/api/love/random", "GET", null\n);`;

const switchTab = (tab: ProfileTab) => {
  router.push(`/profile/${tab}`);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const syncProfileForm = (user: UserVO | null) => {
  profileForm.userName = user?.userName || '';
  profileForm.gender = user?.gender === 1 ? 1 : 0;
};

const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

const quotaTypeText = (item: UserInterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || '基础额度接口';
};

const quotaLeftText = (item: UserInterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '无限次';
  if (item.quotaType === 'ADVANCED_TRIAL') return `${item.leftNum ?? 0} 次体验`;
  return `${item.leftNum ?? 0} 次`;
};

const quotaTagClass = (quotaType?: string) => {
  if (quotaType === 'FREE_UNLIMITED') return 'fei-tag--quota-free';
  if (quotaType === 'ADVANCED_TRIAL') return 'fei-tag--quota-trial';
  return 'fei-tag--quota-basic';
};

const interfaceStatusText = (status?: number) => {
  if (status === 1) return '可调用';
  if (status === 2) return '发布验证中';
  return '暂不可调用';
};

const copyKey = async (text: string) => {
  if (!text) {
    showToast('密钥暂未加载完成', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板', 'success');
  } catch {
    showToast('复制失败，请手动复制', 'error');
  }
};

const copySdkSnippet = async () => {
  try {
    await navigator.clipboard.writeText(sdkSnippet);
    showToast('SDK 示例已复制到剪贴板', 'success');
  } catch {
    showToast('复制失败，请手动复制', 'error');
  }
};

const loadLoginUser = async () => {
  try {
    const user = await userService.getLoginUser();
    loginUser.value = user || null;
    userStore.setLoginUser(loginUser.value);
    syncProfileForm(loginUser.value);
    return Boolean(loginUser.value);
  } catch {
    loginUser.value = null;
    userStore.clearLoginUser();
    syncProfileForm(null);
    return false;
  }
};

const handleProfileSubmit = async () => {
  const userName = profileForm.userName.trim();
  if (nicknameError.value) {
    showToast(nicknameError.value, 'error');
    return;
  }
  if (![0, 1].includes(profileForm.gender)) {
    showToast('请选择正确的性别', 'error');
    return;
  }
  profileSubmitting.value = true;
  try {
    await userService.updateCurrentUserProfile({
      userName,
      gender: profileForm.gender,
    });
    showToast('个人信息已更新', 'success');
    await loadLoginUser();
  } catch (error) {
    showToast(getErrorMessage(error, '个人信息更新失败'), 'error');
  } finally {
    profileSubmitting.value = false;
  }
};

const clearPasswordForm = () => {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.checkPassword = '';
};

const handlePasswordSubmit = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.checkPassword) {
    showToast('请完整填写密码信息', 'error');
    return;
  }
  if (!passwordPattern.test(passwordForm.newPassword)) {
    showToast('新密码需为 8-16 位字母和数字组合', 'error');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.checkPassword) {
    showToast('两次输入的新密码不一致', 'error');
    return;
  }
  if (passwordForm.oldPassword === passwordForm.newPassword) {
    showToast('新密码不能与旧密码相同', 'error');
    return;
  }
  passwordSubmitting.value = true;
  try {
    await userService.updateCurrentUserPassword({ ...passwordForm });
    clearPasswordForm();
    showToast('密码已修改', 'success');
  } catch (error) {
    showToast(getErrorMessage(error, '密码修改失败'), 'error');
  } finally {
    passwordSubmitting.value = false;
  }
};

const loadRecords = async () => {
  try {
    const data = await userInterfaceInfoService.myListPage({ current: 1, pageSize: 10 });
    records.value = data?.records ?? [];
  } catch {
    records.value = [];
  }
};

const loadUserKeys = async () => {
  if (!loginUser.value || userKeys.value || userKeysLoading.value) {
    return;
  }
  userKeysLoading.value = true;
  try {
    const data = await userService.getCurrentUserKeys();
    userKeys.value = data || null;
  } catch {
    userKeys.value = null;
    if (loginUser.value) {
      showToast('密钥加载失败，请稍后重试', 'error');
    }
  } finally {
    userKeysLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
    userStore.clearLoginUser();
    userKeys.value = null;
    records.value = [];
    showToast('已安全退出', 'success');
    // 延迟跳转到首页，让用户看到提示
    setTimeout(() => {
      router.replace('/home');
    }, 1000);
  } catch {
    showToast('退出失败，请稍后重试', 'error');
  }
};

onMounted(async () => {
  const hasLoginUser = await loadLoginUser();
  if (!hasLoginUser) {
    await router.replace('/login');
    return;
  }
  await loadRecords();
  if (activeTab.value === 'keys') {
    await loadUserKeys();
  }
});

watch(activeTab, async (tab) => {
  if (tab !== 'keys') {
    return;
  }
  if (!loginUser.value) {
    await router.replace('/login');
    return;
  }
  await loadUserKeys();
});
</script>

<style scoped>
.fei-profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}

.fei-profile-form-section {
  min-width: 0;
}

.fei-profile-form-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--fei-text);
}

.fei-profile-form-section + .fei-profile-form-section {
  padding-left: 28px;
  border-left: 1px solid var(--fei-border);
}

.fei-input--error {
  border-color: var(--fei-error);
}

.fei-input--error:focus {
  border-color: var(--fei-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}

.fei-field-error {
  color: var(--fei-error);
  font-size: 12px;
  line-height: 1.5;
}

.fei-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .fei-profile-form-grid {
    grid-template-columns: 1fr;
  }

  .fei-profile-form-section + .fei-profile-form-section {
    padding-top: 24px;
    padding-left: 0;
    border-top: 1px solid var(--fei-border);
    border-left: none;
  }
}
</style>
