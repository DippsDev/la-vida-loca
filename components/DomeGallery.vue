<script lang="ts">
import { GLOBE_PLACEHOLDER_IMAGES } from '~/utils/galleryPlaceholders'

export type ImageItem =
  | string
  | { src: string; alt?: string; type?: 'image' | 'video' }

export const DEFAULT_IMAGES = GLOBE_PLACEHOLDER_IMAGES

export const DEFAULTS = {
  fit: 0.8,
  minRadius: 600,
  maxVerticalRotationDeg: 0,
  segments: 34,
  dragDampening: 2,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  autoSpinSpeedDeg: 2,
}
</script>

<script setup lang="ts">
import { DragGesture } from '@use-gesture/vanilla'
import '~/assets/css/DomeGallery.css'

type DomeItem = {
  x: number
  y: number
  sizeX: number
  sizeY: number
  src: string
  alt: string
}

type MediaEntry = {
  src: string
  alt: string
  type: 'image' | 'video'
}

function normalizeMedia(pool: ImageItem[]): MediaEntry[] {
  return pool.map((image) => {
    if (typeof image === 'string') {
      const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(image)
      return { src: image, alt: '', type: isVideo ? 'video' : 'image' }
    }
    const inferredVideo = image.type === 'video'
      || /\.(mp4|webm|ogg)(\?|$)/i.test(image.src || '')
    return {
      src: image.src || '',
      alt: image.alt || '',
      type: inferredVideo ? 'video' : 'image',
    }
  }).filter(item => item.src)
}

const props = withDefaults(defineProps<{
  images?: ImageItem[]
  fit?: number
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height'
  minRadius?: number
  maxRadius?: number
  padFactor?: number
  overlayBlurColor?: string
  maxVerticalRotationDeg?: number
  dragSensitivity?: number
  enlargeTransitionMs?: number
  segments?: number
  dragDampening?: number
  openedImageWidth?: string
  openedImageHeight?: string
  imageBorderRadius?: string
  openedImageBorderRadius?: string
  grayscale?: boolean
  autoSpin?: boolean
  autoSpinSpeedDeg?: number
  autoSpinDelayMs?: number
}>(), {
  images: () => DEFAULT_IMAGES,
  fit: DEFAULTS.fit,
  fitBasis: 'auto',
  minRadius: DEFAULTS.minRadius,
  maxRadius: Infinity,
  padFactor: 0.25,
  overlayBlurColor: '#120F17',
  maxVerticalRotationDeg: DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity: DEFAULTS.dragSensitivity,
  enlargeTransitionMs: DEFAULTS.enlargeTransitionMs,
  segments: DEFAULTS.segments,
  dragDampening: DEFAULTS.dragDampening,
  openedImageWidth: '400px',
  openedImageHeight: '400px',
  imageBorderRadius: '30px',
  openedImageBorderRadius: '30px',
  grayscale: true,
  autoSpin: true,
  autoSpinSpeedDeg: DEFAULTS.autoSpinSpeedDeg,
  autoSpinDelayMs: 600,
})

const emit = defineEmits<{
  ready: []
}>()

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360
  return a - 180
}

function getDataNumber(el: HTMLElement, name: string, fallback: number) {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`)
  const n = attr == null ? NaN : Number.parseFloat(attr)
  return Number.isFinite(n) ? n : fallback
}

function parseCssSize(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const trimmed = value.trim()
  if (trimmed.endsWith('px')) {
    const n = Number.parseFloat(trimmed)
    return Number.isFinite(n) ? n : fallback
  }
  if (trimmed.endsWith('vw')) {
    const n = Number.parseFloat(trimmed)
    return Number.isFinite(n) ? (n / 100) * window.innerWidth : fallback
  }
  if (trimmed.endsWith('vh')) {
    const n = Number.parseFloat(trimmed)
    return Number.isFinite(n) ? (n / 100) * window.innerHeight : fallback
  }
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : fallback
}

/** Keep the enlarged media square inside the viewport with comfortable margins. */
function resolveOpenedImageSize(frameWidth: number, frameHeight: number) {
  const margin = window.innerWidth < 768 ? 20 : 48
  const maxW = Math.max(160, window.innerWidth - margin * 2)
  const maxH = Math.max(160, window.innerHeight - margin * 2)
  const maxSide = Math.min(maxW, maxH)

  let width = parseCssSize(props.openedImageWidth, frameWidth)
  let height = parseCssSize(props.openedImageHeight, frameHeight)

  const scale = Math.min(1, maxSide / Math.max(width, height, 1))
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  return {
    width: `${width}px`,
    height: `${height}px`,
  }
}

const lightboxSwipeStart = ref<{ x: number; y: number } | null>(null)

function onLightboxTouchStart(e: TouchEvent) {
  if (!isEnlarged.value || window.innerWidth >= 768) return
  if (e.touches.length !== 1) return
  const touch = e.touches[0]
  lightboxSwipeStart.value = { x: touch.clientX, y: touch.clientY }
}

function onLightboxTouchEnd(e: TouchEvent) {
  if (!isEnlarged.value || !lightboxSwipeStart.value || window.innerWidth >= 768) return
  const touch = e.changedTouches[0]
  if (!touch) {
    lightboxSwipeStart.value = null
    return
  }

  const dx = touch.clientX - lightboxSwipeStart.value.x
  const dy = touch.clientY - lightboxSwipeStart.value.y
  lightboxSwipeStart.value = null

  // Horizontal swipe only — ignore taps and mostly-vertical gestures
  if (Math.abs(dx) < 56) return
  if (Math.abs(dx) < Math.abs(dy) * 1.15) return

  navigateLightbox(dx < 0 ? 1 : -1)
}

function clearLightboxSwipe() {
  lightboxSwipeStart.value = null
}

function buildItems(pool: ImageItem[], seg: number): DomeItem[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
  const evenYs = [-8, -6, -4, -2, 0, 2, 4, 6, 8]
  const oddYs = [-7, -5, -3, -1, 1, 3, 5, 7, 9]

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs
    return ys.map(y => ({ x, y, sizeX: 1.9, sizeY: 1.9 }))
  })

  const totalSlots = coords.length
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }))
  }

  const normalizedImages = pool.map((image) => {
    if (typeof image === 'string') return { src: image, alt: '' }
    return { src: image.src || '', alt: image.alt || '' }
  })

  const usedImages = Array.from(
    { length: totalSlots },
    (_, i) => normalizedImages[i % normalizedImages.length],
  )

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i]
          usedImages[i] = usedImages[j]
          usedImages[j] = tmp
          break
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
  }))
}

function computeItemBaseRotation(
  offsetX: number,
  offsetY: number,
  sizeX: number,
  sizeY: number,
  segments: number,
) {
  const unit = 360 / segments / 2
  const rotateY = unit * (offsetX + (sizeX - 1) / 2)
  const rotateX = unit * (offsetY - (sizeY - 1) / 2)
  return { rotateX, rotateY }
}

const rootRef = ref<HTMLElement | null>(null)
const mainRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const sphereRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const viewerRef = ref<HTMLElement | null>(null)
const scrimRef = ref<HTMLElement | null>(null)

const focusedElRef = ref<HTMLElement | null>(null)
const originalTilePositionRef = ref<{ left: number; top: number; width: number; height: number } | null>(null)
const rotationRef = ref({ x: -10, y: 0 })
const startRotRef = ref({ x: 0, y: 0 })
const startPosRef = ref<{ x: number; y: number } | null>(null)
const draggingRef = ref(false)
const movedRef = ref(false)
const inertiaRAF = ref<number | null>(null)
const autoSpinRAF = ref<number | null>(null)
const openingRef = ref(false)
const openStartedAtRef = ref(0)
const lastDragEndAt = ref(0)
const scrollLockedRef = ref(false)
const lockedRadiusRef = ref<number | null>(null)
const lightboxIndex = ref(-1)
const isEnlarged = ref(false)

const mediaList = computed(() => normalizeMedia(props.images))
const tileImages = computed(() => mediaList.value.filter(item => item.type === 'image'))
const items = computed(() => buildItems(tileImages.value, props.segments))

function preloadTileImages() {
  if (!import.meta.client) return
  const seen = new Set<string>()
  for (const item of tileImages.value) {
    if (!item.src || seen.has(item.src)) continue
    seen.add(item.src)
    const img = new Image()
    img.decoding = 'async'
    img.src = item.src
  }
}

watch(tileImages, preloadTileImages, { immediate: true })

function createMediaNode(entry: MediaEntry) {
  if (entry.type === 'video') {
    const video = document.createElement('video')
    video.src = entry.src
    video.muted = true
    video.playsInline = true
    video.controls = true
    video.autoplay = true
    video.loop = true
    video.setAttribute('playsinline', '')
    video.setAttribute('aria-label', entry.alt || 'Gallery video')
    return video
  }

  const img = document.createElement('img')
  img.src = entry.src
  img.alt = entry.alt || ''
  img.draggable = false
  return img
}

function fillEnlargeOverlay(overlay: HTMLElement, entry: MediaEntry) {
  overlay.replaceChildren()
  overlay.appendChild(createMediaNode(entry))
}

function resolveLightboxIndex(src: string) {
  const list = mediaList.value
  if (!list.length) return 0
  const exact = list.findIndex(item => item.src === src)
  if (exact >= 0) return exact
  const loose = list.findIndex(item => src.includes(item.src) || item.src.includes(src))
  return loose >= 0 ? loose : 0
}

function navigateLightbox(direction: 1 | -1) {
  if (!isEnlarged.value || !mediaList.value.length) return
  const overlay = viewerRef.value?.querySelector('.enlarge') as HTMLElement | null
  if (!overlay) return

  const next = (lightboxIndex.value + direction + mediaList.value.length) % mediaList.value.length
  lightboxIndex.value = next
  fillEnlargeOverlay(overlay, mediaList.value[next])
}

function applyTransform(xDeg: number, yDeg: number) {
  const sphere = sphereRef.value
  if (!sphere) return
  sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
}

function canAutoSpin() {
  return (
    props.autoSpin
    && !draggingRef.value
    && !focusedElRef.value
    && !openingRef.value
    && inertiaRAF.value == null
  )
}

function stopAutoSpin() {
  if (autoSpinRAF.value) {
    cancelAnimationFrame(autoSpinRAF.value)
    autoSpinRAF.value = null
  }
}

function startAutoSpin() {
  if (!props.autoSpin || autoSpinRAF.value != null) return

  let lastTs = performance.now()

  const step = (ts: number) => {
    const dt = Math.min(0.05, (ts - lastTs) / 1000)
    lastTs = ts

    if (canAutoSpin()) {
      const nextY = wrapAngleSigned(rotationRef.value.y + props.autoSpinSpeedDeg * dt)
      rotationRef.value = { x: rotationRef.value.x, y: nextY }
      applyTransform(rotationRef.value.x, nextY)
    }

    autoSpinRAF.value = requestAnimationFrame(step)
  }

  autoSpinRAF.value = requestAnimationFrame(step)
}

function lockScroll() {
  if (scrollLockedRef.value) return
  scrollLockedRef.value = true
  document.body.classList.add('dg-scroll-lock')
}

function unlockScroll() {
  if (!scrollLockedRef.value) return
  if (rootRef.value?.getAttribute('data-enlarging') === 'true') return
  scrollLockedRef.value = false
  document.body.classList.remove('dg-scroll-lock')
}

function stopInertia() {
  if (inertiaRAF.value) {
    cancelAnimationFrame(inertiaRAF.value)
    inertiaRAF.value = null
  }
}

function startInertia(vx: number, vy: number) {
  const MAX_V = 1.4
  let vX = clamp(vx, -MAX_V, MAX_V) * 80
  let vY = clamp(vy, -MAX_V, MAX_V) * 80
  let frames = 0
  const d = clamp(props.dragDampening ?? 0.6, 0, 1)
  const frictionMul = 0.94 + 0.055 * d
  const stopThreshold = 0.015 - 0.01 * d
  const maxFrames = Math.round(90 + 270 * d)

  const step = () => {
    vX *= frictionMul
    vY *= frictionMul
    if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
      inertiaRAF.value = null
      return
    }
    if (++frames > maxFrames) {
      inertiaRAF.value = null
      return
    }
    const nextX = clamp(
      rotationRef.value.x - vY / 200,
      -props.maxVerticalRotationDeg,
      props.maxVerticalRotationDeg,
    )
    const nextY = wrapAngleSigned(rotationRef.value.y + vX / 200)
    rotationRef.value = { x: nextX, y: nextY }
    applyTransform(nextX, nextY)
    inertiaRAF.value = requestAnimationFrame(step)
  }

  stopInertia()
  inertiaRAF.value = requestAnimationFrame(step)
}

function openItemFromElement(el: HTMLElement) {
  if (openingRef.value) return
  openingRef.value = true
  openStartedAtRef.value = performance.now()
  lockScroll()

  const parent = el.parentElement
  if (!parent || !mainRef.value || !frameRef.value || !viewerRef.value) {
    openingRef.value = false
    unlockScroll()
    return
  }

  focusedElRef.value = el
  el.setAttribute('data-focused', 'true')

  const offsetX = getDataNumber(parent, 'offsetX', 0)
  const offsetY = getDataNumber(parent, 'offsetY', 0)
  const sizeX = getDataNumber(parent, 'sizeX', 2)
  const sizeY = getDataNumber(parent, 'sizeY', 2)
  const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, props.segments)
  const parentY = normalizeAngle(parentRot.rotateY)
  const globalY = normalizeAngle(rotationRef.value.y)
  let rotY = -(parentY + globalY) % 360
  if (rotY < -180) rotY += 360
  const rotX = -parentRot.rotateX - rotationRef.value.x
  parent.style.setProperty('--rot-y-delta', `${rotY}deg`)
  parent.style.setProperty('--rot-x-delta', `${rotX}deg`)

  const refDiv = document.createElement('div')
  refDiv.className = 'item__image item__image--reference'
  refDiv.style.opacity = '0'
  refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`
  parent.appendChild(refDiv)
  void refDiv.offsetHeight

  const tileR = refDiv.getBoundingClientRect()
  const mainR = mainRef.value.getBoundingClientRect()
  const frameR = frameRef.value.getBoundingClientRect()

  if (tileR.width <= 0 || tileR.height <= 0) {
    openingRef.value = false
    focusedElRef.value = null
    parent.removeChild(refDiv)
    unlockScroll()
    return
  }

  originalTilePositionRef.value = {
    left: tileR.left,
    top: tileR.top,
    width: tileR.width,
    height: tileR.height,
  }
  el.style.visibility = 'hidden'
  el.style.zIndex = '0'

  const rawSrc = parent.dataset.src || el.querySelector('img')?.src || ''
  lightboxIndex.value = resolveLightboxIndex(rawSrc)
  const entry = mediaList.value[lightboxIndex.value] || {
    src: rawSrc,
    alt: '',
    type: 'image' as const,
  }

  const overlay = document.createElement('div')
  overlay.className = 'enlarge'
  overlay.style.position = 'absolute'
  overlay.style.left = `${frameR.left - mainR.left}px`
  overlay.style.top = `${frameR.top - mainR.top}px`
  overlay.style.width = `${frameR.width}px`
  overlay.style.height = `${frameR.height}px`
  overlay.style.opacity = '0'
  overlay.style.zIndex = '30'
  overlay.style.willChange = 'transform, opacity'
  overlay.style.transformOrigin = 'top left'
  overlay.style.transition = `transform ${props.enlargeTransitionMs}ms ease, opacity ${props.enlargeTransitionMs}ms ease`
  fillEnlargeOverlay(overlay, entry)
  viewerRef.value.appendChild(overlay)
  isEnlarged.value = true

  const tx0 = tileR.left - frameR.left
  const ty0 = tileR.top - frameR.top
  const sx0 = tileR.width / frameR.width
  const sy0 = tileR.height / frameR.height
  const validSx0 = Number.isFinite(sx0) && sx0 > 0 ? sx0 : 1
  const validSy0 = Number.isFinite(sy0) && sy0 > 0 ? sy0 : 1
  overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`

  setTimeout(() => {
    if (!overlay.parentElement) return
    overlay.style.opacity = '1'
    overlay.style.transform = 'translate(0px, 0px) scale(1, 1)'
    rootRef.value?.setAttribute('data-enlarging', 'true')
  }, 16)

  const wantsResize = props.openedImageWidth || props.openedImageHeight
  if (wantsResize) {
    const onFirstEnd = (ev: TransitionEvent) => {
      if (ev.propertyName !== 'transform') return
      overlay.removeEventListener('transitionend', onFirstEnd)
      const prevTransition = overlay.style.transition
      overlay.style.transition = 'none'

      const { width: tempWidth, height: tempHeight } = resolveOpenedImageSize(
        frameR.width,
        frameR.height,
      )

      overlay.style.width = tempWidth
      overlay.style.height = tempHeight
      const newRect = overlay.getBoundingClientRect()
      overlay.style.width = `${frameR.width}px`
      overlay.style.height = `${frameR.height}px`
      void overlay.offsetWidth
      overlay.style.transition = `left ${props.enlargeTransitionMs}ms ease, top ${props.enlargeTransitionMs}ms ease, width ${props.enlargeTransitionMs}ms ease, height ${props.enlargeTransitionMs}ms ease`

      // Center within the viewport (main), not the smaller guide frame
      const centeredLeft = (mainR.width - newRect.width) / 2
      const centeredTop = (mainR.height - newRect.height) / 2

      requestAnimationFrame(() => {
        overlay.style.left = `${centeredLeft}px`
        overlay.style.top = `${centeredTop}px`
        overlay.style.width = tempWidth
        overlay.style.height = tempHeight
      })
      const cleanupSecond = () => {
        overlay.removeEventListener('transitionend', cleanupSecond)
        overlay.style.transition = prevTransition
      }
      overlay.addEventListener('transitionend', cleanupSecond, { once: true })
    }
    overlay.addEventListener('transitionend', onFirstEnd)
  }
}

function onTileClick(e: MouseEvent) {
  if (draggingRef.value) return
  if (movedRef.value) return
  if (performance.now() - lastDragEndAt.value < 80) return
  if (openingRef.value) return
  openItemFromElement(e.currentTarget as HTMLElement)
}

function onTilePointerUp(e: PointerEvent) {
  if (e.pointerType !== 'touch') return
  if (draggingRef.value) return
  if (movedRef.value) return
  if (performance.now() - lastDragEndAt.value < 80) return
  if (openingRef.value) return
  openItemFromElement(e.currentTarget as HTMLElement)
}

function closeEnlarge() {
  if (performance.now() - openStartedAtRef.value < 250) return
  const el = focusedElRef.value
  if (!el || !rootRef.value || !viewerRef.value) return
  const parent = el.parentElement
  const overlay = viewerRef.value.querySelector('.enlarge')
  if (!parent || !overlay) return

  const refDiv = parent.querySelector('.item__image--reference')
  const originalPos = originalTilePositionRef.value

  if (!originalPos) {
    overlay.remove()
    refDiv?.remove()
    parent.style.setProperty('--rot-y-delta', '0deg')
    parent.style.setProperty('--rot-x-delta', '0deg')
    el.style.visibility = ''
    el.style.zIndex = '0'
    focusedElRef.value = null
    isEnlarged.value = false
    lightboxIndex.value = -1
    clearLightboxSwipe()
    rootRef.value.removeAttribute('data-enlarging')
    openingRef.value = false
    unlockScroll()
    return
  }

  const currentRect = overlay.getBoundingClientRect()
  const rootRect = rootRef.value.getBoundingClientRect()
  const originalPosRelativeToRoot = {
    left: originalPos.left - rootRect.left,
    top: originalPos.top - rootRect.top,
    width: originalPos.width,
    height: originalPos.height,
  }
  const overlayRelativeToRoot = {
    left: currentRect.left - rootRect.left,
    top: currentRect.top - rootRect.top,
    width: currentRect.width,
    height: currentRect.height,
  }

  const animatingOverlay = document.createElement('div')
  animatingOverlay.className = 'enlarge-closing'
  animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${props.enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`
  const originalMedia = overlay.querySelector('img, video')
  if (originalMedia) {
    const media = originalMedia.cloneNode(true) as HTMLElement
    media.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    if (media instanceof HTMLVideoElement) {
      media.pause()
      media.removeAttribute('controls')
      media.muted = true
    }
    animatingOverlay.appendChild(media)
  }
  overlay.remove()
  isEnlarged.value = false
  lightboxIndex.value = -1
  clearLightboxSwipe()
  rootRef.value.appendChild(animatingOverlay)
  void animatingOverlay.getBoundingClientRect()
  requestAnimationFrame(() => {
    animatingOverlay.style.left = `${originalPosRelativeToRoot.left}px`
    animatingOverlay.style.top = `${originalPosRelativeToRoot.top}px`
    animatingOverlay.style.width = `${originalPosRelativeToRoot.width}px`
    animatingOverlay.style.height = `${originalPosRelativeToRoot.height}px`
    animatingOverlay.style.opacity = '0'
  })

  const cleanup = () => {
    animatingOverlay.remove()
    originalTilePositionRef.value = null
    refDiv?.remove()
    parent.style.transition = 'none'
    el.style.transition = 'none'
    parent.style.setProperty('--rot-y-delta', '0deg')
    parent.style.setProperty('--rot-x-delta', '0deg')
    requestAnimationFrame(() => {
      el.style.visibility = ''
      el.style.opacity = '0'
      el.style.zIndex = '0'
      focusedElRef.value = null
      rootRef.value?.removeAttribute('data-enlarging')
      requestAnimationFrame(() => {
        parent.style.transition = ''
        el.style.transition = 'opacity 300ms ease-out'
        requestAnimationFrame(() => {
          el.style.opacity = '1'
          setTimeout(() => {
            el.style.transition = ''
            el.style.opacity = ''
            openingRef.value = false
            if (!draggingRef.value && rootRef.value?.getAttribute('data-enlarging') !== 'true') {
              document.body.classList.remove('dg-scroll-lock')
              scrollLockedRef.value = false
            }
          }, 300)
        })
      })
    })
  }
  animatingOverlay.addEventListener('transitionend', cleanup, { once: true })
}

const rootStyle = computed(() => ({
  '--segments-x': props.segments,
  '--segments-y': props.segments,
  '--overlay-blur-color': props.overlayBlurColor,
  '--tile-radius': props.imageBorderRadius,
  '--enlarge-radius': props.openedImageBorderRadius,
  '--image-filter': props.grayscale ? 'grayscale(1)' : 'none',
}))

const cleanupFns: Array<() => void> = []

onMounted(() => {
  const root = rootRef.value
  const main = mainRef.value
  if (!root || !main) return

  const ro = new ResizeObserver((entries) => {
    const cr = entries[0].contentRect
    const w = Math.max(1, cr.width)
    const h = Math.max(1, cr.height)
    const minDim = Math.min(w, h)
    const maxDim = Math.max(w, h)
    const aspect = w / h
    let basis: number
    switch (props.fitBasis) {
      case 'min':
        basis = minDim
        break
      case 'max':
        basis = maxDim
        break
      case 'width':
        basis = w
        break
      case 'height':
        basis = h
        break
      default:
        basis = aspect >= 1.3 ? w : minDim
    }
    let radius = basis * props.fit
    radius = Math.min(radius, h * 1.35)
    radius = clamp(radius, props.minRadius, props.maxRadius)
    lockedRadiusRef.value = Math.round(radius)

    const viewerPad = Math.max(
      16,
      Math.round(minDim * (w < 768 ? Math.min(props.padFactor, 0.08) : props.padFactor)),
    )
    root.style.setProperty('--radius', `${lockedRadiusRef.value}px`)
    root.style.setProperty('--viewer-pad', `${viewerPad}px`)
    root.style.setProperty('--overlay-blur-color', props.overlayBlurColor)
    root.style.setProperty('--tile-radius', props.imageBorderRadius)
    root.style.setProperty('--enlarge-radius', props.openedImageBorderRadius)
    root.style.setProperty('--image-filter', props.grayscale ? 'grayscale(1)' : 'none')
    applyTransform(rotationRef.value.x, rotationRef.value.y)
  })
  ro.observe(root)
  applyTransform(rotationRef.value.x, rotationRef.value.y)

  let readySent = false
  let autoSpinScheduled = false
  const sendReady = () => {
    if (readySent || !lockedRadiusRef.value) return
    readySent = true
    root.setAttribute('data-ready', 'true')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        emit('ready')
        if (props.autoSpin && !autoSpinScheduled) {
          autoSpinScheduled = true
          window.setTimeout(startAutoSpin, props.autoSpinDelayMs)
        }
      })
    })
  }

  requestAnimationFrame(() => {
    sendReady()
    window.setTimeout(sendReady, 150)
  })

  const gesture = new DragGesture(
    main,
    ({ event, first, last, velocity = [0, 0], direction = [0, 0], movement }) => {
      if (focusedElRef.value) return

      if (first) {
        stopInertia()
        const evt = event as PointerEvent
        draggingRef.value = true
        movedRef.value = false
        startRotRef.value = { ...rotationRef.value }
        startPosRef.value = { x: evt.clientX, y: evt.clientY }
        return
      }

      if (!draggingRef.value || !startPosRef.value) return
      const evt = event as PointerEvent
      const dxTotal = evt.clientX - startPosRef.value.x
      const dyTotal = evt.clientY - startPosRef.value.y
      if (!movedRef.value) {
        const dist2 = dxTotal * dxTotal + dyTotal * dyTotal
        if (dist2 > 16) movedRef.value = true
      }
      const nextX = clamp(
        startRotRef.value.x - dyTotal / props.dragSensitivity,
        -props.maxVerticalRotationDeg,
        props.maxVerticalRotationDeg,
      )
      const nextY = wrapAngleSigned(startRotRef.value.y + dxTotal / props.dragSensitivity)
      if (rotationRef.value.x !== nextX || rotationRef.value.y !== nextY) {
        rotationRef.value = { x: nextX, y: nextY }
        applyTransform(nextX, nextY)
      }

      if (last) {
        draggingRef.value = false
        let [vMagX, vMagY] = velocity
        const [dirX, dirY] = direction
        let vx = vMagX * dirX
        let vy = vMagY * dirY
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
          const [mx, my] = movement
          vx = clamp((mx / props.dragSensitivity) * 0.02, -1.2, 1.2)
          vy = clamp((my / props.dragSensitivity) * 0.02, -1.2, 1.2)
        }
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy)
        if (movedRef.value) lastDragEndAt.value = performance.now()
        movedRef.value = false
      }
    },
    { eventOptions: { passive: true } },
  )

  const onKey = (e: KeyboardEvent) => {
    if (!isEnlarged.value && e.key !== 'Escape') return
    if (e.key === 'Escape') {
      closeEnlarge()
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      navigateLightbox(1)
      return
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      navigateLightbox(-1)
    }
  }
  window.addEventListener('keydown', onKey)

  cleanupFns.push(() => {
    ro.disconnect()
    gesture.destroy()
    window.removeEventListener('keydown', onKey)
    stopInertia()
    stopAutoSpin()
    document.body.classList.remove('dg-scroll-lock')
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
})
</script>

<template>
  <div
    ref="rootRef"
    class="sphere-root"
    :style="rootStyle"
  >
    <main
      ref="mainRef"
      class="sphere-main"
    >
      <div
        ref="stageRef"
        class="stage"
      >
        <div
          ref="sphereRef"
          class="sphere"
        >
          <div
            v-for="(it, i) in items"
            :key="`${it.x},${it.y},${i}`"
            class="item"
            :data-src="it.src"
            :data-offset-x="it.x"
            :data-offset-y="it.y"
            :data-size-x="it.sizeX"
            :data-size-y="it.sizeY"
            :style="{
              '--offset-x': it.x,
              '--offset-y': it.y,
              '--item-size-x': it.sizeX,
              '--item-size-y': it.sizeY,
            }"
          >
            <div
              class="item__image"
              role="button"
              tabindex="0"
              :aria-label="it.alt || 'Open image'"
              @click="onTileClick"
              @pointerup="onTilePointerUp"
            >
              <img
                :src="it.src"
                draggable="false"
                :alt="it.alt"
                decoding="async"
                loading="eager"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="overlay" />
      <div class="overlay overlay--blur" />
      <div class="edge-fade edge-fade--top" />
      <div class="edge-fade edge-fade--bottom" />

      <div
        ref="viewerRef"
        class="viewer"
        @touchstart.passive="onLightboxTouchStart"
        @touchend.passive="onLightboxTouchEnd"
      >
        <div
          ref="scrimRef"
          class="scrim"
          @click="closeEnlarge"
        />
        <div
          ref="frameRef"
          class="frame"
        />

        <button
          v-show="isEnlarged"
          type="button"
          class="lightbox-nav lightbox-nav--prev"
          aria-label="Previous media"
          @click.stop="navigateLightbox(-1)"
        >
          ‹
        </button>
        <button
          v-show="isEnlarged"
          type="button"
          class="lightbox-nav lightbox-nav--next"
          aria-label="Next media"
          @click.stop="navigateLightbox(1)"
        >
          ›
        </button>
      </div>
    </main>
  </div>
</template>
