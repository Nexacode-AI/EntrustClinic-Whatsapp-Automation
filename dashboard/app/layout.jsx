import './globals.css'
import Sidebar from '../components/Sidebar'

export const metadata = {
  title: 'Entrust Clinic — Management System',
  description: 'Production-grade clinic management for Malaysian private clinics',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex h-screen overflow-hidden bg-page">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto px-6 py-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
