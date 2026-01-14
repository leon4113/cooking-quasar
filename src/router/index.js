import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { LocalStorage } from 'quasar'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Simple auth guard: require auth for main app pages
  Router.beforeEach((to, from, next) => {
    const publicPaths = ['/loginpage', '/landing', '/signup']
    const isPublic = publicPaths.includes(to.path)

    const token = LocalStorage.getItem('token')
    const isAuthenticated = !!token

    if (!isPublic && !isAuthenticated) {
      return next('/loginpage')
    }

    // If already authenticated and navigating to login/signup/landing, redirect to home
    if (isAuthenticated && isPublic && to.path !== '/home') {
      return next('/home')
    }

    return next()
  })

  return Router
})
