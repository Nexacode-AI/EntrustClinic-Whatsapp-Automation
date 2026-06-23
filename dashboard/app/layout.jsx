import './globals.css'
import Shell from '../components/Shell'

export const metadata = {
  title: 'Entrust Clinic — Management System',
  description: 'Production-grade clinic management for Malaysian private clinics',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-page">
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
