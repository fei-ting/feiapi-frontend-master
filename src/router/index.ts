import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: () => import('@/views/HomeView.vue') },
    { path: '/interface/:id', component: () => import('@/views/InterfaceDetailView.vue') },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    { path: '/register', component: () => import('@/views/RegisterView.vue') },
    {
      path: '/profile/:tab?',
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/admin/:tab?',
      component: () => import('@/views/AdminView.vue'),
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
});

export default router;
