import { createRouter, createWebHistory } from 'vue-router'
import Products from '../views/Products.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import { pinia } from '../pinia'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'products', component: Products },
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: Register },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)
  const token = authStore.token
  const isAuthRoute = to.name === 'login' || to.name === 'register'
  if (!token && !isAuthRoute) return { name: 'login' }
  if (token && isAuthRoute) return { name: 'products' }
})

export default router
