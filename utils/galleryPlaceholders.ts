export type GalleryImage = {
  src: string
  alt?: string
  type?: 'image' | 'video'
}

export type ImageItem = string | GalleryImage

function greySvg(fill: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480"><rect width="480" height="480" fill="${fill}"/></svg>`
}

function greyPlaceholder(fill: string, alt: string): GalleryImage {
  return {
    src: `data:image/svg+xml,${encodeURIComponent(greySvg(fill))}`,
    alt,
    type: 'image',
  }
}

/** Grey tile placeholders for the globe. */
export const GLOBE_PLACEHOLDER_IMAGES: ImageItem[] = [
  greyPlaceholder('#8a9099', 'Placeholder 1'),
  greyPlaceholder('#727882', 'Placeholder 2'),
  greyPlaceholder('#9aa0a8', 'Placeholder 3'),
  greyPlaceholder('#6e7580', 'Placeholder 4'),
  greyPlaceholder('#858b94', 'Placeholder 5'),
  greyPlaceholder('#788088', 'Placeholder 6'),
  greyPlaceholder('#969ca3', 'Placeholder 7'),
]

export const GALLERY_IMAGES: ImageItem[] = [...GLOBE_PLACEHOLDER_IMAGES]

export const GLOBE_TILE_SOURCES = GLOBE_PLACEHOLDER_IMAGES.map((item) =>
  typeof item === 'string' ? item : item.src,
)

/** Grey backgrounds for the splash screen. */
export const SPLASH_BACKGROUNDS = [
  greyPlaceholder('#8a9099', 'Splash placeholder 1').src,
  greyPlaceholder('#727882', 'Splash placeholder 2').src,
  greyPlaceholder('#9aa0a8', 'Splash placeholder 3').src,
]
