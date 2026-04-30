// ⚠️ Remplace https://metaagent.fr par ton domaine réel
const SITE_URL = 'https://metaagent.fr'

export default function sitemap() {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
