export type GalleryImage = {
  src: string
  alt?: string
  type?: 'image' | 'video'
}

export type ImageItem = string | GalleryImage

/** Coast and boat scenes, plus house-party stills mixed through the globe. */
export const GLOBE_PLACEHOLDER_IMAGES: ImageItem[] = [
  { src: '/gallery/people-01.jpg', alt: 'Swimmers in a turquoise cove along a rocky shore' },
  { src: '/gallery/people-02.jpg', alt: 'People swimming beside a boat in clear blue water' },
  { src: '/gallery/people-03.jpg', alt: 'A crowded rocky cove full of swimmers' },
  { src: '/gallery/people-04.jpg', alt: 'Three people swimming in clear turquoise water' },
  { src: '/gallery/people-05.jpg', alt: 'A busy beach with people swimming in turquoise water' },
  { src: '/gallery/people-06.jpg', alt: 'Swimmers in clear water beside a buoy' },
  { src: '/gallery/people-07.jpg', alt: 'Friends sitting on the bow of a boat' },
  { src: '/gallery/people-08.jpg', alt: 'Friends relaxing on the deck of a boat' },
  { src: '/gallery/people-09.jpg', alt: 'Three friends on a boat in a cliff cove' },
  { src: '/gallery/people-10.jpg', alt: 'Friends in a dinghy on turquoise water' },
  { src: '/gallery/people-11.jpg', alt: 'A boat full of people beneath sea cliffs' },
  { src: '/gallery/people-12.jpg', alt: 'Friends sitting together on a boat' },
  { src: '/gallery/people-13.jpg', alt: 'Swimmers in sparkling turquoise water' },
  { src: '/gallery/people-14.jpg', alt: 'People swimming over a rocky seabed' },
  { src: '/gallery/people-15.jpg', alt: 'Paddleboarders in a rocky turquoise cove' },
  { src: '/gallery/people-16.jpg', alt: 'Swimmers along a turquoise shoreline' },
  { src: '/gallery/party-01.jpg', alt: 'Friends dancing in a living room' },
  { src: '/gallery/party-02.jpg', alt: 'A house party with friends and drinks on the sofa' },
  { src: '/gallery/party-03.jpg', alt: 'Friends dancing under blue party lights' },
  { src: '/gallery/party-04.jpg', alt: 'Friends dancing in an apartment' },
  { src: '/gallery/party-05.jpg', alt: 'People dancing at a house party' },
  { src: '/gallery/party-06.jpg', alt: 'Friends dancing under neon lights' },
  { src: '/gallery/party-07.jpg', alt: 'Two friends dancing at a party' },
  { src: '/gallery/party-08.jpg', alt: 'A living-room party with drinks and music' },
  { src: '/gallery/coast-01.jpg', alt: 'Boats in turquoise water along a rocky Ibiza cove' },
  { src: '/gallery/coast-05.jpg', alt: 'Es Vedrà rising out of the Mediterranean' },
  { src: '/splash-ibiza-1080.mp4', alt: 'Aerial of Ibiza’s clear water and rocky shore', type: 'video' },
  { src: '/gallery/coast-sea.mp4', alt: 'Sunlight on turquoise sea', type: 'video' },
]

export const GALLERY_IMAGES: ImageItem[] = [...GLOBE_PLACEHOLDER_IMAGES]

/** The sphere uses the original photos so the squares stay sharp. */
export function globeTileSrc(src: string) {
  return src
}

export const GLOBE_TILE_SOURCES = GLOBE_PLACEHOLDER_IMAGES.flatMap((item) => {
  if (typeof item === 'string') return /\.(mp4|webm|ogg)(\?|$)/i.test(item) ? [] : [globeTileSrc(item)]
  if (item.type === 'video' || /\.(mp4|webm|ogg)(\?|$)/i.test(item.src)) return []
  return [globeTileSrc(item.src)]
})
