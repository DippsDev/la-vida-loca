import type { ImageItem } from '~/components/DomeGallery.vue'

function greySvg(fill: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480"><rect width="480" height="480" fill="${fill}"/></svg>`
}

function greyPlaceholder(fill: string, alt: string): ImageItem {
  return {
    src: `data:image/svg+xml,${encodeURIComponent(greySvg(fill))}`,
    alt,
    type: 'image',
  }
}

/** Grey tile placeholders for the globe (lightbox videos kept separate). */
export const GLOBE_PLACEHOLDER_IMAGES: ImageItem[] = [
  greyPlaceholder('#8a9099', 'Placeholder 1'),
  greyPlaceholder('#727882', 'Placeholder 2'),
  greyPlaceholder('#9aa0a8', 'Placeholder 3'),
  greyPlaceholder('#6e7580', 'Placeholder 4'),
  greyPlaceholder('#858b94', 'Placeholder 5'),
  greyPlaceholder('#788088', 'Placeholder 6'),
  greyPlaceholder('#969ca3', 'Placeholder 7'),
]

export const GLOBE_LIGHTBOX_VIDEOS: ImageItem[] = [
  { src: '/splash.mp4', alt: 'Placeholder clip 1', type: 'video' },
  { src: '/splash-2.mp4', alt: 'Placeholder clip 2', type: 'video' },
  { src: '/splash-3.mp4', alt: 'Placeholder clip 3', type: 'video' },
]

export const GALLERY_IMAGES: ImageItem[] = [
  ...GLOBE_PLACEHOLDER_IMAGES,
  ...GLOBE_LIGHTBOX_VIDEOS,
]

export const GLOBE_TILE_SOURCES = GLOBE_PLACEHOLDER_IMAGES.map((item) =>
  typeof item === 'string' ? item : item.src,
)

/** Grey backgrounds for the splash screen (replaces video clips for now). */
export const SPLASH_BACKGROUNDS = [
  greyPlaceholder('#8a9099', 'Splash placeholder 1').src,
  greyPlaceholder('#727882', 'Splash placeholder 2').src,
  greyPlaceholder('#9aa0a8', 'Splash placeholder 3').src,
]
