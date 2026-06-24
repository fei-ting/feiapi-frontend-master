<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="admin" @logout="handleLogout" />
    <PageContainer>
      <div class="fei-layout-detail" style="grid-template-columns: 240px minmax(0, 1fr)">
        <aside class="fei-panel">
          <div class="fei-tabbar" style="flex-direction: column">
            <a class="fei-tab" :class="{ 'is-active': activeTab === 'interfaces' }" href="#/admin/interfaces">接口管理</a>
            <a class="fei-tab" :class="{ 'is-active': activeTab === 'analysis' }" href="#/admin/analysis">接口分析</a>
            <a class="fei-tab" :class="{ 'is-active': activeTab === 'relations' }" href="#/admin/relations">调用关系</a>
          </div>
        </aside>

        <section class="fei-panel">
          <template v-if="activeTab === 'interfaces'">
            <SectionHeader title="接口列表" />
            <div class="fei-table-wrap" style="margin-top: 18px">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>接口名称</th>
                    <th>请求方法</th>
                    <th>请求地址</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in interfaces" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.method }}</td>
                    <td>{{ item.url }}</td>
                    <td>{{ statusText(item.status) }}</td>
                    <td>编辑 / 发布 / 删除</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <template v-else-if="activeTab === 'analysis'">
            <SectionHeader title="调用次数 TOP3 接口" />
            <div class="fei-card" style="margin-top: 18px; padding: 24px">
              <div v-if="topList.length" class="fei-grid-3">
                <div v-for="item in topList" :key="item.id" class="fei-feature">
                  <div class="fei-section-title" style="font-size: 18px">{{ item.name }}</div>
                  <p class="fei-section-desc">调用次数：{{ item.totalNum }}</p>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <SectionHeader title="用户接口调用关系" />
            <div class="fei-table-wrap" style="margin-top: 18px">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户</th>
                    <th>接口</th>
                    <th>总调用次数</th>
                    <th>剩余次数</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in relations" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.userName }}</td>
                    <td>{{ item.interfaceName }}</td>
                    <td>{{ item.totalNum }}</td>
                    <td>{{ item.leftNum }}</td>
                    <td>{{ item.status === 0 ? '正常' : '停用' }}</td>
                  </tr>
                </tbody>
              </table>
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
import { analysisService } from '@/services/analysis';
import { interfaceService } from '@/services/interfaceInfo';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import { userService } from '@/services/user';
import type { InterfaceInfoVO, UserInterfaceInfoVO, UserVO } from '@/types/api';

const route = useRoute();
const activeTab = computed(() => (route.params.tab as string) || 'interfaces');
const loginUser = ref<UserVO | null>(null);
const interfaces = ref<InterfaceInfoVO[]>([]);
const relations = ref<UserInterfaceInfoVO[]>([]);
const topList = ref<InterfaceInfoVO[]>([]);

const statusText = (status?: number) => {
  if (status === 1) return '上线';
  if (status === 2) return '发布验证中';
  return '关闭';
};

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
  } catch {
    loginUser.value = null;
  }
};

const loadInterfaces = async () => {
  const res = await interfaceService.listPage({ current: 1, pageSize: 10 });
  interfaces.value = res.data?.records ?? [];
};

const loadRelations = async () => {
  const res = await userInterfaceInfoService.adminListPage({ current: 1, pageSize: 10 });
  relations.value = res.data?.records ?? [];
};

const loadTop = async () => {
  const res = await analysisService.topInvoke();
  topList.value = res.data ?? [];
};

const handleLogout = async () => {
  await userService.logout();
  loginUser.value = null;
};

onMounted(async () => {
  await loadLoginUser();
  await loadInterfaces();
  await loadRelations();
  await loadTop();
});
</script>
