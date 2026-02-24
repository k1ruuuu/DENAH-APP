import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from "@/app/context/AuthContext"; // Tambahkan ini
import ProtectedRoute from '@/app/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Sistem Denah Digital UNISBA',
  description: 'Aplikasi denah ruangan interaktif dengan integrasi API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 text-gray-900">
        <AuthProvider> {/* Tambahkan AuthProvider di sini */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}