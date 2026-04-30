// ⚠️ Remplace https://metaagent.fr par ton domaine réel
const SITE_URL = 'https://metaagent.fr'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
