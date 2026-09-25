export {
  GALLERY_IMAGES,
  GLOBE_TILE_SOURCES,
} from '~/utils/galleryPlaceholders'

export function useGlobeGallery() {
  const showVeil = useState('globe-show-veil', () => false)
  const veilOut = useState('globe-veil-out', () => false)
  const navIn = useState('globe-nav-in', () => true)
  const splashHandled = useState('globe-splash-handled', () => false)

  function initFromSplash() {
    if (splashHandled.value || !import.meta.client) return
    splashHandled.value = true

    let fromSplash = false
    try {
      fromSplash = sessionStorage.getItem('loca-from-splash') === '1'
      if (fromSplash) sessionStorage.removeItem('loca-from-splash')
    }
    catch {
      // ignore
    }

    if (fromSplash) {
      navIn.value = false
      requestAnimationFrame(() => {
        navIn.value = true
      })
    }
  }

  function liftVeil() {
    if (!showVeil.value || veilOut.value) return
    requestAnimationFrame(() => {
      if (!showVeil.value || veilOut.value) return
      veilOut.value = true
      navIn.value = true
      window.setTimeout(() => {
        showVeil.value = false
      }, 320)
    })
  }

  return {
    showVeil,
    veilOut,
    navIn,
    initFromSplash,
    liftVeil,
  }
}
