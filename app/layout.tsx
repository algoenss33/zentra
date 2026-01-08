import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const spaceFont = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Zentra Wallet - Secure Crypto Management",
  description: "Your self-custodial crypto wallet with encrypted private keys and professional portfolio management",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zentra Wallet",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0e11",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d]">
      <body className={`font-sans antialiased bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white ${spaceFont.variable}`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
