import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'MetaAgent — Construis des agents IA',
  description: 'Plateforme de génération d agents IA par LangGraph + Claude',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}