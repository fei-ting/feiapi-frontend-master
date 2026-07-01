import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: () => import('@/views/HomeView.vue') },
    { path: '/market', component: () => import('@/views/InterfaceMarketView.vue') },
    { path: '/interface/:id', component: () => import('@/views/InterfaceDetailView.vue') },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
    {
      path: '/profile/:tab?',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/:tab?',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (requiresAuth || (!userStore.loaded && guestOnly)) {
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
