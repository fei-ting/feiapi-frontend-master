<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="profile" @logout="handleLogout" />
    <PageContainer>
      <div class="fei-layout-detail" style="grid-template-columns: 240px minmax(0, 1fr)">
        <aside class="fei-panel">
          <div class="fei-tabbar" style="flex-direction: column">
            <a class="fei-tab" :class="{ 'is-active': activeTab === 'records' }" href="#/profile/records">我的调用</a>
            <a class="fei-tab" :class="{ 'is-active': activeTab === 'keys' }" href="#/profile/keys">密钥管理</a>
          </div>
        </aside>

        <section class="fei-panel">
          <template v-if="activeTab === 'records'">
            <SectionHeader title="我的调用记录" />
            <div class="fei-table-wrap" style="margin-top: 18px">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>接口名称</th>
                    <th>总调用次数</th>
                    <th>剩余次数</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in records" :key="item.id">
                    <td>{{ item.interfaceName }}</td>
                    <td>{{ item.totalNum }}</td>
                    <td>{{ item.leftNum }}</td>
                    <td>{{ item.status === 0 ? '正常' : '停用' }}</td>
                    <td><a :href="`#/interface/${item.interfaceInfoId}`">去调用</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <template v-else>
            <SectionHeader title="访问密钥" desc="请妥善保管您的 accessKey 与 secretKey，避免泄露。" />
            <div v-if="loginUser" class="fei-form" style="margin-top: 18px">
              <div class="fei-field">
                <label class="fei-label">Access Key</label>
                <div class="fei-card" style="padding: 14px 16px">{{ loginUser.accessKey }}</div>
              </div>
              <div class="fei-field">
                <label class="fei-label">Secret Key</label>
                <div class="fei-card" style="padding: 14px 16px">{{ maskedSecret }}</div>
              </div>
              <div class="fei-card" style="padding: 16px; background: #fafcff">
                <pre class="fei-code" style="margin: 0">{{ sdkSnippet }}</pre>
              </div>
            </div>
          </template>
        </section>
      </div>
    </PageContainer>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import SectionHeader from '@/components/SectionHeader.vue';
import { userService } from '@/services/user';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import type { UserInterfaceInfoVO, UserVO } from '@/types/api';

const route = useRoute();
const activeTab = computed(() => (route.params.tab === 'keys' ? 'keys' : 'records'));
const loginUser = ref<UserVO | null>(null);
const records = ref<UserInterfaceInfoVO[]>([]);

const maskedSecret = computed(() => {
  const secret = loginUser.value?.secretKey || '';
  if (!secret) return '';
  return `${secret.slice(0, 8)}${'•'.repeat(Math.max(secret.length - 12, 4))}${secret.slice(-4)}`;
});

const sdkSnippet = computed(() => {
  const accessKey = loginUser.value?.accessKey || '';
  const secretKey = loginUser.value?.secretKey || '';
  return `FeiApiClient client = new FeiApiClient("${accessKey}", "${secretKey}");\nString result = client.invoke("/api/love/random", "GET", null);`;
});

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
  } catch {
    loginUser.value = null;
  }
};

const loadRecords = async () => {
  try {
    const res = await userInterfaceInfoService.myListPage({ current: 1, pageSize: 10 });
    records.value = res.data?.records ?? [];
  } catch {
    records.value = [];
  }
};

const handleLogout = async () => {
  await userService.logout();
  loginUser.value = null;
};

onMounted(async () => {
  await loadLoginUser();
  await loadRecords();
});
</script>
