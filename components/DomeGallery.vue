<script lang="ts">
import { GLOBE_PLACEHOLDER_IMAGES, globeTileSrc, type ImageItem } from '~/utils/galleryPlaceholders'

export type { ImageItem }

export const DEFAULT_IMAGES = GLOBE_PLACEHOLDER_IMAGES

export const DEFAULTS = {
  fit: 0.8,
  minRadius: 600,
  maxVerticalRotationDeg: 0,
  segments: 34,
  dragDampening: 2,
  dragSensitivity: 20,
  enlargeTransitionMs: 380,
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
  tileSrc: string
  alt: string
  type: 'image' | 'video'
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
  playVideos?: boolean
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
  grayscale: false,
  autoSpin: true,
  autoSpinSpeedDeg: DEFAULTS.autoSpinSpeedDeg,
  autoSpinDelayMs: 600,
  playVideos: true,
})

const emit = defineEmits<{
  ready: []
}>()

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/** iPhone SE portrait crop. Phones and iPad/tablet viewports share it; wide desktops do not. */
function usesSeCrop(w: number, h: number) {
  if (w < 768) return true
  const aspect = w / h
  return w <= 1400 && aspect >= 13 / 20 && aspect <= 20 / 13
}
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
  showSwipeHint.value = false

  // Horizontal swipe only — ignore taps and mostly-vertical gestures
  if (Math.abs(dx) < 56) return
  if (Math.abs(dx) < Math.abs(dy) * 1.15) return

  navigateLightbox(dx < 0 ? 1 : -1)
}

function clearLightboxSwipe() {
  lightboxSwipeStart.value = null
}

function buildItems(pool: MediaEntry[], seg: number): DomeItem[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
  const evenYs = [-8, -6, -4, -2, 0, 2, 4, 6, 8]
  const oddYs = [-7, -5, -3, -1, 1, 3, 5, 7, 9]

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs
    return ys.map(y => ({ x, y, sizeX: 1.9, sizeY: 1.9 }))
  })

  const totalSlots = coords.length
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', tileSrc: '', alt: '', type: 'image' as const }))
  }

  const images = pool.filter(item => item.type !== 'video')
  const videos = pool.filter(item => item.type === 'video')
  const stills = images.length > 0 ? images : pool
  const rows = evenYs.length
  const usedImages = scatterStills(stills, totalSlots, rows)

  // A handful of clips, not one on every repeat, so the sphere stays light.
  const videoSlots = [22, 74, 128, 186, 236, 286]
  videoSlots.forEach((slot, index) => {
    const clip = videos[index % videos.length]
    if (!clip || slot >= usedImages.length) return
    usedImages[slot] = clip
  })

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    tileSrc: usedImages[i].type === 'image' ? globeTileSrc(usedImages[i].src) : usedImages[i].src,
    alt: usedImages[i].alt,
    type: usedImages[i].type,
  }))
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Spread stills so a tile does not match the pictures beside or above it. */
function scatterStills(stills: MediaEntry[], totalSlots: number, rows: number) {
  const rand = mulberry32(0x1b12a5)
  const used: MediaEntry[] = []
  for (let i = 0; i < totalSlots; i++) {
    const col = Math.floor(i / rows)
    const row = i % rows
    const forbidden = new Set<string>()
    const ban = (index: number) => {
      const item = used[index]
      if (item) forbidden.add(item.src)
    }
    for (let r = 0; r < row; r++) ban(col * rows + r)
    if (col > 0) {
      ban((col - 1) * rows + row)
      if (row > 0) ban((col - 1) * rows + (row - 1))
      if (row + 1 < rows) ban((col - 1) * rows + (row + 1))
    }
    let choices = stills.filter(item => !forbidden.has(item.src))
    if (choices.length === 0) {
      const previous = used[i - 1]?.src
      choices = stills.filter(item => item.src !== previous)
    }
    if (choices.length === 0) choices = stills
    used.push(choices[Math.floor(rand() * choices.length)])
  }
  return used
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
const openingRef = ref(false)
const openStartedAtRef = ref(0)
const lastDragEndAt = ref(0)
const scrollLockedRef = ref(false)
const lockedRadiusRef = ref<number | null>(null)
const lightboxIndex = ref(-1)
const isEnlarged = ref(false)
const showSwipeHint = ref(false)
const showScrollHint = ref(false)
let swipeHintTimer: number | undefined
let autoSpinResumeTimer: number | null = null
let spinFrame: number | null = null
let spinClock: { originTs: number, originY: number, velocity: number } | null = null

const mediaList = computed(() => normalizeMedia(props.images))
const tileImages = computed(() => mediaList.value.filter(item => item.type === 'image'))
const items = computed(() => buildItems(mediaList.value, props.segments))

function preloadTileImages() {
  if (!import.meta.client) return
  const seen = new Set<string>()
  for (const item of tileImages.value) {
    if (!item.src || seen.has(item.src)) continue
    seen.add(item.src)
    const img = new Image()
    img.decoding = 'async'
    img.src = globeTileSrc(item.src)
    void img.decode().catch(() => {})
  }
}

watch(tileImages, preloadTileImages, { immediate: true })

watch(() => props.playVideos, (play) => {
  if (!play || !import.meta.client) return
  nextTick(() => {
    rootRef.value?.querySelectorAll('video').forEach((node) => {
      const video = node as HTMLVideoElement
      const start = () => {
        video.muted = true
        void video.play().catch(() => {})
      }
      if (video.error) video.load()
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) start()
      else video.addEventListener('loadeddata', start, { once: true })
    })
  })
})

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
  syncPlaceholderMark(entry, overlay)
}

function isPlaceholderSrc(src: string) {
  return src.startsWith('data:image/svg+xml')
}

function syncPlaceholderMark(entry: MediaEntry, overlay: HTMLElement) {
  const viewer = viewerRef.value
  if (!viewer) return

  const existing = viewer.querySelector('.enlarge-mark')
  if (!isPlaceholderSrc(entry.src)) {
    existing?.remove()
    return
  }
  if (existing) return

  const mark = document.createElement('p')
  mark.className = 'enlarge-mark'
  mark.setAttribute('role', 'status')

  const lineOne = document.createElement('span')
  lineOne.textContent = 'Leave your mark on'
  const lineTwo = document.createElement('span')
  lineTwo.textContent = 'La Vida Loca'
  mark.append(lineOne, lineTwo)

  const left = Number.parseFloat(overlay.style.left) || 0
  const top = Number.parseFloat(overlay.style.top) || 0
  const width = Number.parseFloat(overlay.style.width) || overlay.offsetWidth
  const height = Number.parseFloat(overlay.style.height) || overlay.offsetHeight
  mark.style.left = `${left}px`
  mark.style.top = `${top + height + 18}px`
  mark.style.width = `${width}px`
  viewer.appendChild(mark)
  requestAnimationFrame(syncScrollPad)
}

function resolveLightboxIndex(src: string) {
  const list = mediaList.value
  if (!list.length) return 0
  const exact = list.findIndex(item => item.src === src)
  if (exact >= 0) return exact
  const loose = list.findIndex(item => src.includes(item.src) || item.src.includes(src))
  return loose >= 0 ? loose : 0
}

function syncScrollPad() {
  const viewer = viewerRef.value
  if (!viewer) return

  const mark = viewer.querySelector('.enlarge-mark') as HTMLElement | null
  let pad = viewer.querySelector('.enlarge-scroll-pad') as HTMLElement | null
  if (!mark) {
    pad?.remove()
    showScrollHint.value = false
    return
  }

  const needed = mark.offsetTop + mark.offsetHeight + 28
  if (needed <= viewer.clientHeight + 8) {
    pad?.remove()
    viewer.scrollTop = 0
    showScrollHint.value = false
    return
  }

  if (!pad) {
    pad = document.createElement('div')
    pad.className = 'enlarge-scroll-pad'
    pad.setAttribute('aria-hidden', 'true')
    viewer.appendChild(pad)
  }
  pad.style.height = `${needed}px`
  showScrollHint.value = viewer.scrollTop + viewer.clientHeight < viewer.scrollHeight - 16
}

function onViewerScroll() {
  const viewer = viewerRef.value
  if (!viewer) return
  showScrollHint.value = viewer.scrollTop + viewer.clientHeight < viewer.scrollHeight - 16
}

function showMobileSwipeHint() {
  window.clearTimeout(swipeHintTimer)
  if (!import.meta.client || window.innerWidth >= 768) {
    showSwipeHint.value = false
    return
  }
  showSwipeHint.value = true
  swipeHintTimer = window.setTimeout(() => {
    showSwipeHint.value = false
  }, 2800)
}

function clearLightboxHints() {
  window.clearTimeout(swipeHintTimer)
  showSwipeHint.value = false
  showScrollHint.value = false
  viewerRef.value?.querySelector('.enlarge-scroll-pad')?.remove()
}

function navigateLightbox(direction: 1 | -1) {
  if (!isEnlarged.value || !mediaList.value.length) return
  const overlay = viewerRef.value?.querySelector('.enlarge') as HTMLElement | null
  if (!overlay) return

  const next = (lightboxIndex.value + direction + mediaList.value.length) % mediaList.value.length
  lightboxIndex.value = next
  fillEnlargeOverlay(overlay, mediaList.value[next])
}

function sphereRadiusPx() {
  return lockedRadiusRef.value ?? 0
}

function applyTransform(xDeg: number, yDeg: number) {
  const sphere = sphereRef.value
  if (!sphere) return
  const y = ((yDeg % 360) + 360) % 360
  const radius = sphereRadiusPx()
  const translate = radius > 0
    ? `translateZ(${-radius}px)`
    : 'translateZ(calc(var(--radius) * -1))'
  sphere.style.transform = `${translate} rotateX(${xDeg}deg) rotateY(${y}deg)`
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

function cancelSpinLoop() {
  if (spinFrame == null) return
  cancelAnimationFrame(spinFrame)
  spinFrame = null
}

function clearAutoSpinResume() {
  if (autoSpinResumeTimer != null) {
    window.clearTimeout(autoSpinResumeTimer)
    autoSpinResumeTimer = null
  }
}

function liveSpinY(ts = performance.now()) {
  if (!spinClock) return rotationRef.value.y
  return spinClock.originY + spinClock.velocity * ((ts - spinClock.originTs) / 1000)
}

/** Park the globe on its current angle and stop the spin loop. */
function freezeSpin() {
  clearAutoSpinResume()
  const y = liveSpinY()
  cancelSpinLoop()
  spinClock = null
  rotationRef.value = { x: rotationRef.value.x, y: wrapAngleSigned(y) }
  applyTransform(rotationRef.value.x, rotationRef.value.y)
}

function stopAutoSpin() {
  freezeSpin()
}

/**
 * Yaw is a straight function of time, written as a 0–360° transform.
 * The displayed angle wraps forward only, so the loop has no reverse hitch.
 */
function runSpinClock(fromY: number, velocity: number) {
  if (!canAutoSpin()) return
  cancelSpinLoop()
  const originTs = performance.now()
  spinClock = { originTs, originY: fromY, velocity }

  const step = (ts: number) => {
    if (!canAutoSpin() || !spinClock) {
      spinFrame = null
      return
    }
    const target = props.autoSpinSpeedDeg
    const elapsed = (ts - spinClock.originTs) / 1000
    let angle = spinClock.originY + spinClock.velocity * elapsed
    if (Math.abs(spinClock.velocity - target) > 0.02) {
      const dt = Math.min(0.032, elapsed)
      const k = 1 - Math.exp(-dt / 0.4)
      const nextV = spinClock.velocity + (target - spinClock.velocity) * k
      angle = spinClock.originY + ((spinClock.velocity + nextV) / 2) * dt
      spinClock = { originTs: ts, originY: angle, velocity: nextV }
    }
    rotationRef.value = { x: rotationRef.value.x, y: wrapAngleSigned(angle) }
    applyTransform(rotationRef.value.x, angle)
    spinFrame = requestAnimationFrame(step)
  }

  spinFrame = requestAnimationFrame(step)
}

function blendToCruise(fromVelocity: number) {
  runSpinClock(rotationRef.value.y, fromVelocity)
}

function startAutoSpin() {
  runSpinClock(rotationRef.value.y, props.autoSpinSpeedDeg)
}

/** Resume idle spin after drag/inertia — restarts the loop if it was stopped. */
function scheduleAutoSpinResume(delayMs = 0) {
  if (!props.autoSpin) return
  clearAutoSpinResume()
  autoSpinResumeTimer = window.setTimeout(() => {
    autoSpinResumeTimer = null
    if (inertiaRAF.value != null) {
      scheduleAutoSpinResume(120)
      return
    }
    if (!canAutoSpin() || spinFrame != null) return
    runSpinClock(rotationRef.value.y, props.autoSpinSpeedDeg)
  }, delayMs)
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
  const frictionMul = 0.92 + 0.04 * d
  // End sooner so residual micro-motion doesn't block auto-spin for seconds
  const stopThreshold = 0.12 - 0.04 * d
  const maxFrames = Math.round(45 + 90 * d)

  const finishInertia = () => {
    inertiaRAF.value = null
    blendToCruise((vX / 200) * 60)
  }

  const step = () => {
    vX *= frictionMul
    vY *= frictionMul
    if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
      finishInertia()
      return
    }
    if (++frames > maxFrames) {
      finishInertia()
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

function whenTransitionEnds(el: HTMLElement, property: string, ms: number, cb: () => void) {
  let done = false
  const finish = () => {
    if (done) return
    done = true
    el.removeEventListener('transitionend', onEnd)
    window.clearTimeout(timer)
    cb()
  }
  const onEnd = (ev: TransitionEvent) => {
    if (ev.target !== el) return
    if (property && ev.propertyName !== property) return
    finish()
  }
  el.addEventListener('transitionend', onEnd)
  const timer = window.setTimeout(finish, ms + 80)
}

function openItemFromElement(el: HTMLElement) {
  if (openingRef.value) return
  freezeSpin()
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

  const { width: finalWidthCss, height: finalHeightCss } = resolveOpenedImageSize(
    frameR.width,
    frameR.height,
  )
  const finalWidth = Number.parseFloat(finalWidthCss)
  const finalHeight = Number.parseFloat(finalHeightCss)
  const centeredLeft = (mainR.width - finalWidth) / 2
  const centeredTop = (mainR.height - finalHeight) / 2

  const overlay = document.createElement('div')
  overlay.className = 'enlarge'
  overlay.style.cssText = [
    'position:absolute',
    `left:${centeredLeft}px`,
    `top:${centeredTop}px`,
    `width:${finalWidth}px`,
    `height:${finalHeight}px`,
    'opacity:0',
    'z-index:30',
    'transform-origin:top left',
    'transition:none',
    'will-change:transform, opacity',
    'max-width:none',
    'max-height:none',
  ].join(';')

  const sx0 = tileR.width / Math.max(finalWidth, 1)
  const sy0 = tileR.height / Math.max(finalHeight, 1)
  const tx0 = tileR.left - mainR.left - centeredLeft
  const ty0 = tileR.top - mainR.top - centeredTop
  overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${sx0}, ${sy0})`

  fillEnlargeOverlay(overlay, entry)
  viewerRef.value.appendChild(overlay)
  isEnlarged.value = true
  void overlay.offsetWidth

  const ms = props.enlargeTransitionMs
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
  requestAnimationFrame(() => {
    if (!overlay.parentElement) return
    overlay.style.transition = `transform ${ms}ms ${ease}, opacity ${ms}ms ease-out`
    overlay.style.opacity = '1'
    overlay.style.transform = 'translate(0px, 0px) scale(1, 1)'
    rootRef.value?.setAttribute('data-enlarging', 'true')
  })

  whenTransitionEnds(overlay, 'transform', ms, () => {
    overlay.style.willChange = 'auto'
    overlay.style.transition = ''
    syncScrollPad()
    showMobileSwipeHint()
  })
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
  const overlay = viewerRef.value.querySelector('.enlarge') as HTMLElement | null
  viewerRef.value.querySelector('.enlarge-mark')?.remove()
  clearLightboxHints()
  if (!parent || !overlay) return

  const refDiv = parent.querySelector('.item__image--reference')
  const originalPos = originalTilePositionRef.value
  const ms = props.enlargeTransitionMs
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'

  const finishClose = () => {
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
        el.style.transition = 'opacity 220ms ease-out'
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
            scheduleAutoSpinResume(0)
          }, 220)
        })
      })
    })
  }

  if (!originalPos) {
    overlay.remove()
    isEnlarged.value = false
    lightboxIndex.value = -1
    clearLightboxSwipe()
    finishClose()
    return
  }

  const currentRect = overlay.getBoundingClientRect()
  const rootRect = rootRef.value.getBoundingClientRect()

  const animatingOverlay = document.createElement('div')
  animatingOverlay.className = 'enlarge-closing'
  animatingOverlay.style.cssText = [
    'position:absolute',
    `left:${currentRect.left - rootRect.left}px`,
    `top:${currentRect.top - rootRect.top}px`,
    `width:${currentRect.width}px`,
    `height:${currentRect.height}px`,
    'z-index:9999',
    'border-radius:var(--enlarge-radius, 32px)',
    'overflow:hidden',
    'box-shadow:0 10px 30px rgba(0,0,0,.35)',
    'pointer-events:none',
    'margin:0',
    'transform-origin:top left',
    'transition:none',
    'will-change:transform, opacity',
    'opacity:1',
  ].join(';')

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
  void animatingOverlay.offsetWidth

  const tx = originalPos.left - currentRect.left
  const ty = originalPos.top - currentRect.top
  const sx = originalPos.width / Math.max(currentRect.width, 1)
  const sy = originalPos.height / Math.max(currentRect.height, 1)

  requestAnimationFrame(() => {
    animatingOverlay.style.transition = `transform ${ms}ms ${ease}, opacity ${Math.round(ms * 0.85)}ms ease-out`
    animatingOverlay.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`
    animatingOverlay.style.opacity = '0'
  })

  whenTransitionEnds(animatingOverlay, 'transform', ms, () => {
    animatingOverlay.remove()
    finishClose()
  })
}

const tileRadius = ref(props.imageBorderRadius)

const rootStyle = computed(() => ({
  '--segments-x': props.segments,
  '--segments-y': props.segments,
  '--overlay-blur-color': props.overlayBlurColor,
  '--tile-radius': tileRadius.value,
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
    const seCrop = usesSeCrop(w, h)
    let radius: number
    // iPhone SE portrait is a 600px sphere in a 375×667 screen.
    // Scale that same crop to cover phones, iPads, and other tablets.
    if (seCrop) {
      radius = 600 * Math.max(w / 375, h / 667)
    }
    else {
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
      radius = basis * props.fit
      radius = Math.min(radius, h * 1.35)
      radius = clamp(radius, props.minRadius, props.maxRadius)
    }
    lockedRadiusRef.value = Math.round(radius)

    const viewerPad = Math.max(
      16,
      Math.round(minDim * (seCrop ? Math.min(props.padFactor, 0.08) : props.padFactor)),
    )
    root.style.setProperty('--radius', `${lockedRadiusRef.value}px`)
    root.style.setProperty('--viewer-pad', `${viewerPad}px`)
    root.style.setProperty('--overlay-blur-color', props.overlayBlurColor)
    // Phone tiles are about 90px. A 30px corner turns them into circles.
    tileRadius.value = w < 768 ? '8px' : props.imageBorderRadius
    root.style.setProperty('--enlarge-radius', props.openedImageBorderRadius)
    root.style.setProperty('--image-filter', props.grayscale ? 'grayscale(1)' : 'none')
    applyTransform(rotationRef.value.x, liveSpinY())
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
    ({ event, first, last, canceled, velocity = [0, 0], direction = [0, 0], movement }) => {
      if (focusedElRef.value) return

      if (first) {
        stopInertia()
        freezeSpin()
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

      if (last || canceled) {
        draggingRef.value = false
        startPosRef.value = null

        if (canceled) {
          scheduleAutoSpinResume(0)
          movedRef.value = false
          return
        }

        let [vMagX, vMagY] = velocity
        const [dirX, dirY] = direction
        let vx = vMagX * dirX
        let vy = vMagY * dirY
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
          const [mx, my] = movement
          vx = clamp((mx / props.dragSensitivity) * 0.02, -1.2, 1.2)
          vy = clamp((my / props.dragSensitivity) * 0.02, -1.2, 1.2)
        }
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
          startInertia(vx, vy)
        }
        else {
          scheduleAutoSpinResume(0)
        }
        if (movedRef.value) lastDragEndAt.value = performance.now()
        movedRef.value = false
      }
    },
    { eventOptions: { passive: true } },
  )

  // Mobile safety: if the gesture never fires `last`, clear drag so auto-spin can resume
  const endDragIfStuck = () => {
    if (!draggingRef.value) return
    draggingRef.value = false
    startPosRef.value = null
    scheduleAutoSpinResume(0)
  }
  main.addEventListener('pointerup', endDragIfStuck)
  main.addEventListener('pointercancel', endDragIfStuck)
  main.addEventListener('touchend', endDragIfStuck)
  main.addEventListener('touchcancel', endDragIfStuck)

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
    main.removeEventListener('pointerup', endDragIfStuck)
    main.removeEventListener('pointercancel', endDragIfStuck)
    main.removeEventListener('touchend', endDragIfStuck)
    main.removeEventListener('touchcancel', endDragIfStuck)
    clearAutoSpinResume()
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
              :aria-label="it.alt || (it.type === 'video' ? 'Open video' : 'Open image')"
              @click="onTileClick"
              @pointerup="onTilePointerUp"
            >
              <video
                v-if="it.type === 'video'"
                :src="playVideos ? it.src : undefined"
                muted
                loop
                playsinline
                :autoplay="playVideos"
                :preload="playVideos ? 'auto' : 'none'"
                :aria-label="it.alt"
              />
              <img
                v-else
                :src="it.tileSrc"
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
        @scroll.passive="onViewerScroll"
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

        <p
          v-show="showSwipeHint"
          class="lightbox-swipe-hint"
        >
          <span aria-hidden="true">‹</span>
          Swipe
          <span aria-hidden="true">›</span>
        </p>
        <p
          v-show="showScrollHint"
          class="lightbox-scroll-hint"
        >
          Scroll
        </p>
      </div>
    </main>
  </div>
</template>
