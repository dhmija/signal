import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "@/styles/globals.css"
import { AuthProvider } from "@/providers/AuthProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { SocketProvider } from "@/providers/SocketProvider"
import { ThemeScript } from "./ThemeScript"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Signal Desktop",
  description: "Speak Freely. Say 'hello' to a private messaging experience.",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <ThemeScript />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} bg-background text-foreground font-sans antialiased selection:bg-primary/30 selection:text-primary`}>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>{children}</SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
