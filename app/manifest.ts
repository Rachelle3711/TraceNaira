import type { MetadataRoute } from 'next'

// What phones use when someone adds TraceNaira to their home screen: name, icon and colours
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TraceNaira',
    short_name: 'TraceNaira',
    description: 'Follow every step. Own every transfer.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F2A1E',
    theme_color: '#0F2A1E',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}