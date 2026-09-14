export default defineNuxtRouteMiddleware((to, from) => {
  const fromPath = from.path.replace(/\/$/, '') || '/'
  const toPath = to.path.replace(/\/$/, '') || '/'

  if (fromPath === '/home' && toPath === '/rsvp') {
    to.meta.pageTransition = {
      name: 'slide-to-rsvp',
      mode: 'out-in',
    }
    return
  }

  if (fromPath === '/rsvp' && toPath === '/home') {
    to.meta.pageTransition = {
      name: 'slide-to-gallery',
      mode: 'out-in',
    }
  }
})
