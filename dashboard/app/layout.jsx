import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '../components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = { title: 'Entrust Clinic — Dashboard' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen overflow-hidden`} style={{ backgroundColor: '#f8fafc' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
