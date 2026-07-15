import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        { path: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'market', component: () => import('@/views/InterfaceMarketView.vue') },
        { path: 'interface/:id', component: () => import('@/views/InterfaceDetailView.vue') },
        { path: 'interface/:id/invoke', component: () => import('@/views/InterfaceInvokeView.vue') },
      ],
    },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
    {
      path: '/profile',
      component: () => import('@/layouts/ProfileLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/profile/info' },
        { path: 'info', component: () => import('@/views/profile/ProfileInfoView.vue') },
        { path: 'records', component: () => import('@/views/profile/InvocationRecordsView.vue') },
        { path: 'keys', component: () => import('@/views/profile/AccessKeysView.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'interfaces', component: () => import('@/views/admin/InterfaceManagementView.vue') },
        { path: 'quotas', component: () => import('@/views/admin/QuotaConfigView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
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
