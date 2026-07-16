import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: 'home' } },
    {
      path: '/',
      name: 'app',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        { path: 'home', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { feature: 'home' } },
        { path: 'market', name: 'interface-market', component: () => import('@/views/InterfaceMarketView.vue'), meta: { feature: 'interface-market' } },
        { path: 'interface/:id', name: 'interface-detail', component: () => import('@/views/InterfaceDetailView.vue'), meta: { feature: 'interface-detail' } },
        { path: 'interface/:id/invoke', name: 'interface-invoke', component: () => import('@/views/InterfaceInvokeView.vue'), meta: { feature: 'interface-invoke' } },
      ],
    },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true, feature: 'auth' } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true, feature: 'auth' } },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/layouts/ProfileLayout.vue'),
      meta: { requiresAuth: true, feature: 'profile' },
      children: [
        { path: '', name: 'profile-root', redirect: { name: 'profile-info' } },
        { path: 'info', name: 'profile-info', component: () => import('@/views/profile/ProfileInfoView.vue'), meta: { feature: 'profile-info' } },
        { path: 'records', name: 'profile-records', component: () => import('@/views/profile/InvocationRecordsView.vue'), meta: { feature: 'profile-records' } },
        { path: 'keys', name: 'profile-keys', component: () => import('@/views/profile/AccessKeysView.vue'), meta: { feature: 'profile-keys' } },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, feature: 'admin' },
      children: [
        { path: '', name: 'admin-root', redirect: { name: 'admin-dashboard' } },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { feature: 'admin-dashboard' } },
        { path: 'interfaces', name: 'admin-interfaces', component: () => import('@/views/admin/InterfaceManagementView.vue'), meta: { feature: 'admin-interfaces' } },
        { path: 'quotas', name: 'admin-quotas', component: () => import('@/views/admin/QuotaConfigView.vue'), meta: { feature: 'admin-quotas' } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { feature: 'not-found' } },
  ],
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (!userStore.loaded) {
    await userStore.fetchLoginUser();
  }

  if (requiresAuth && !userStore.loginUser) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    };
  }

  if (requiresAdmin && userStore.loginUser?.userRole !== 'admin') {
    return '/home';
  }

  if (guestOnly && userStore.loginUser) {
    return '/home';
  }

  return true;
});

export default router;
