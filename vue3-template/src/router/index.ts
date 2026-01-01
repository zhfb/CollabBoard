import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { hasToken } from '../utils/token'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Boards',
    component: () => import('../views/BoardsView.vue'),
    meta: {
      requiresAuth: true // 需要登录才能访问
    }
  },
  {
    path: '/boards',
    name: 'BoardsList',
    component: () => import('../views/BoardsView.vue'),
    meta: {
      requiresAuth: true // 需要登录才能访问
    }
  },
  {  
    path: '/board/:id',
    name: 'KanbanBoard',
    component: () => import('../components/BoardView.vue'),
    meta: {
      requiresAuth: true // 需要登录才能访问
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      requiresAuth: false // 不需要登录就能访问
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: {
      requiresAuth: false // 不需要登录就能访问
    }
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.meta.requiresAuth) {
    // 检查是否有token
    if (hasToken()) {
      next()
    } else {
      // 没有token，跳转到登录页
      next('/login')
    }
  } else {
    // 不需要认证的路由，直接放行
    next()
  }
})

export default router