import { createRouter, createWebHistory } from '@ionic/vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import type { RouteLocationNormalized } from 'vue-router'
import { auth } from '@/services/firebase'
import LoginPage from '@/views/LoginPage.vue'
import InscriptionPage from '@/views/InscriptionPage.vue'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/inscription',
      component: InscriptionPage,
      meta: { guestOnly: true },
    },
    {
      path: '/home',
      component: HomePage,
      meta: { requiresAuth: true },
    },
  ],
})

let authReady: Promise<void> | undefined

function waitForAuth(): Promise<void> {
  if (!authReady) {
    authReady = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe()
        resolve()
      })

      setTimeout(() => {
        unsubscribe()
        resolve()
      }, 3000)
    })
  }
  return authReady
}

router.beforeEach(async (to: RouteLocationNormalized) => {
  await waitForAuth()
  const user = auth.currentUser

  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  if (to.meta.guestOnly && user) {
    return '/home'
  }
})

export default router
