import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { systemModules, modulePath } from '@/modules/registry'
import AdminLayout from '@/layouts/AdminLayout.vue'
const generated = Object.values(
  import.meta.glob<{ default: RouteRecordRaw }>('../modules/generated/*/route.ts', { eager: true }),
).map((m) => m.default)
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/pages/LoginPage.vue'), meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', component: () => import('@/pages/HomePage.vue') },
        ...systemModules.map((module) => ({
          path: modulePath(module),
          component: () => import('@/components/crud/CrudPage.vue'),
          props: { module },
          meta: { permission: module.key + ':read' },
        })),
        ...generated,
        {
          path: '/tools/generator',
          component: () => import('@/pages/GeneratorPage.vue'),
          meta: { permission: 'generator:create' },
        },
        { path: '/settings', component: () => import('@/pages/SettingsPage.vue') },
        {
          path: '/403',
          component: () => import('@/pages/ErrorPage.vue'),
          props: { code: '403', message: '当前账号没有访问此页面的权限' },
        },
        {
          path: '/:pathMatch(.*)*',
          component: () => import('@/pages/ErrorPage.vue'),
          props: { code: '404', message: '你访问的页面不存在' },
        },
      ],
    },
  ],
})
router.beforeEach((to) => {
  const auth = useAuth()
  if (!to.meta.public && !auth.session) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.path === '/login' && auth.session) return '/'
  if (to.meta.permission && !auth.can(String(to.meta.permission))) return '/403'
})
