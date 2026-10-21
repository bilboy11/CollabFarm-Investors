import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { hideHeader: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { hideHeader: true },
    },
    {
      path: '/basic-information',
      name: 'basic-information',
      component: () => import('../views/BasicInformationView.vue'),
      meta: { hideHeader: true },
    },
    {
      path: '/dashboard',
      component: () => import('../layouts/InvestorLayout.vue'),
      meta: { hideHeader: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/InvestorDashboardView.vue'),
        },
        {
          path: 'wallet',
          name: 'dashboard-wallet',
          component: () => import('../views/WalletView.vue'),
        },
        {
          path: 'packages',
          name: 'dashboard-packages',
          component: () => import('../views/FundingPackagesView.vue'),
        },
        {
          path: 'packages/:id',
          name: 'dashboard-package-detail',
          component: () => import('../views/PackageDetailView.vue'),
        },
        {
          path: 'applications',
          name: 'dashboard-applications',
          component: () => import('../views/DashboardSectionView.vue'),
        },
        {
          path: 'investments',
          name: 'dashboard-investments',
          component: () => import('../views/InvestmentsView.vue'),
        },
        {
          path: 'reports',
          name: 'dashboard-reports',
          component: () => import('../views/DashboardSectionView.vue'),
        },
        {
          path: 'profile',
          name: 'dashboard-profile',
          component: () => import('../views/ProfileView.vue'),
        },
        {
          path: 'settings',
          name: 'dashboard-settings',
          component: () => import('../views/SettingsView.vue'),
        },
        {
          path: 'help',
          name: 'dashboard-help',
          component: () => import('../views/DashboardSectionView.vue'),
        },
      ],
    },
  ],
})

export default router
