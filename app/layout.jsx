import './globals.css'
import { Toaster } from 'sonner'
import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

// ⚠️ Remplace https://metaagent.fr par ton domaine réel
const SITE_URL = 'https://metaagent.fr'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'MetaAgent | Créez votre Agent IA sur-mesure en 30s',
  description:
    'Automatisez vos tâches chronophages sans coder. MetaAgent génère des agents IA sur-mesure pour les PME françaises : restaurant, e-commerce, immobilier, RH et plus encore. Essai gratuit.',
  keywords: [
    'créer agent IA français',
    'automatiser tâches entreprise sans coder',
    'agent IA PME',
    'intelligence artificielle PME France',
    'agent IA sans code',
    'automatisation PME',
    'agent IA restaurant',
    'agent IA e-commerce',
  ],
  authors: [{ name: 'MetaAgent' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1 },
  },
  openGraph: {
    title: 'MetaAgent | Créez votre Agent IA sur-mesure en 30s',
    description:
      'Automatisez vos tâches chronophages sans coder. MetaAgent génère des agents IA sur-mesure pour les PME françaises.',
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'MetaAgent',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MetaAgent | Créez votre Agent IA sur-mesure en 30s',
    description:
      'Automatisez vos tâches chronophages sans coder. Agents IA sur-mesure pour PME françaises.',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MetaAgent',
  description:
    'Créez des agents IA sur-mesure pour automatiser les tâches de votre PME sans coder.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'fr',
  url: SITE_URL,
  offers: [
    { '@type': 'Offer', price: '29', priceCurrency: 'EUR', name: 'Starter' },
    { '@type': 'Offer', price: '89', priceCurrency: 'EUR', name: 'Pro' },
    { '@type': 'Offer', price: '299', priceCurrency: 'EUR', name: 'Business' },
  ],
}

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Puis-je annuler à tout moment ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, sans engagement. Tu annules en 1 clic depuis ton espace client. Aucun frais caché.',
      },
    },
    {
      '@type': 'Question',
      name: 'Je ne suis pas développeur, est-ce fait pour moi ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolument. Tu décris ton agent en français normal, notre IA fait tout le travail technique à ta place.',
      },
    },
    {
      '@type': 'Question',
      name: 'Mes données sont-elles protégées ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui. Tes agents et données sont stockés de façon sécurisée. Nous ne partageons jamais tes informations.',
      },
    },
    {
      '@type': 'Question',
      name: "Que se passe-t-il après les 2 essais gratuits ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tu choisis un plan adapté. Le plan Starter à 29€/mois te donne accès à 3 agents actifs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Avez-vous une garantie satisfait ou remboursé ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui ! 14 jours satisfait ou remboursé, sans question posée. Tu ne prends aucun risque.',
      },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      </head>
      <body className={dmSans.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
