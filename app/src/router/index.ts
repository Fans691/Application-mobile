import { createRouter, createWebHistory } from '@ionic/vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import type { RouteLocationNormalized } from 'vue-router'
import { auth } from '@/services/firebase'
import { lireRole } from '@/services/users.service'
import type { Role } from '@/types/models'
import LoginPage from '@/views/LoginPage.vue'
import InscriptionPage from '@/views/InscriptionPage.vue'
import TabsPage from '@/views/TabsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/inscription', component: InscriptionPage, meta: { guestOnly: true } },
    { path: '/home', redirect: '/tabs/perdus' },
    {
      path: '/tabs/',
      component: TabsPage,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/tabs/perdus' },
        { path: 'perdus', component: () => import('@/views/ObjetsPerdusPage.vue') },
        { path: 'recuperes', component: () => import('@/views/ObjetsRecuperesPage.vue') },
        { path: 'declarer', component: () => import('@/views/DeclarerObjetPage.vue') },
        { path: 'notifications', component: () => import('@/views/NotificationsPage.vue') },
        { path: 'profil', component: () => import('@/views/ProfilPage.vue') },
      ],
    },
    {
      path: '/objets/:id',
      component: () => import('@/views/ObjetDetailPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: () => import('@/views/AdminPage.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/tabs/perdus' },
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

const roles = new Map<string, Role>()

async function roleDe(uid: string): Promise<Role> {
  if (!roles.has(uid)) {
    try {
      roles.set(uid, await lireRole(uid))
    } catch {
      return 'user'
    }
  }
  return roles.get(uid)!
}

export const accueilPour = (role: Role) => (role === 'admin' ? '/admin' : '/tabs/perdus')

router.beforeEach(async (to: RouteLocationNormalized) => {
  await waitForAuth()
  const user = auth.currentUser

  if (!user) {
    return to.matched.some((r) => r.meta.requiresAuth) ? '/login' : true
  }

  const role = await roleDe(user.uid)

  if (to.meta.guestOnly) return accueilPour(role)
  if (to.meta.adminOnly && role !== 'admin') return '/tabs/perdus'
  if (!to.meta.adminOnly && role === 'admin' && to.matched.some((r) => r.meta.requiresAuth)) {
    return '/admin'
  }
  return true
})

export default router
