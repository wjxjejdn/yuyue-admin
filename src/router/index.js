import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 如果部署在子路径（如 /admin），需要设置 base
// const base = import.meta.env.BASE_URL || '/admin/'
const base = import.meta.env.BASE_URL || '/'

const router = createRouter({
  history: createWebHistory(base),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '仪表板' }
        },
        {
          path: 'visits',
          name: 'Visits',
          component: () => import('@/views/visits/VisitList.vue'),
          meta: { title: '预约管理' }
        },
        {
          path: 'visits/:id',
          name: 'VisitDetail',
          component: () => import('@/views/visits/VisitDetail.vue'),
          meta: { title: '预约详情' }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/UserList.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'approvals',
          name: 'Approvals',
          component: () => import('@/views/approvals/ApprovalList.vue'),
          meta: { title: '审批记录' }
        },
        {
          path: 'checkins',
          name: 'CheckIns',
          component: () => import('@/views/checkins/CheckInList.vue'),
          meta: { title: '门禁记录' }
        },
        {
          path: 'roles',
          name: 'Roles',
          component: () => import('@/views/roles/RoleList.vue'),
          meta: { title: '角色管理' }
        },
        {
          path: 'roles/:role/permissions',
          name: 'RolePermissions',
          component: () => import('@/views/roles/RolePermissions.vue'),
          meta: { title: '角色权限配置' }
        },
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import('@/views/statistics/Statistics.vue'),
          meta: { title: '统计管理' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果访问根路径且未登录，重定向到登录页
  if (to.path === '/' && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
