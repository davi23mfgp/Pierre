import type { Metadata, Viewport } from "next"
import { Onest } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

// Mesma família do Control.Deal. Sem carregá-la, o fallback do Windows cai numa
// serifada e a tela deixa de parecer o mesmo produto.
const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pierre — seu contador pessoal",
  description:
    "Organize contas, dívidas e metas em um lugar só. Projeção de caixa, plano de pagamento e ajuda para decidir empréstimo. Para pessoa física e MEI.",
  manifest: "/manifest.webmanifest",
  // Instalado na tela inicial do celular, o app abre sem barra de navegador.
  appleWebApp: { capable: true, title: "Pierre", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icones/icone-192.png", sizes: "192x192" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
  width: "device-width",
  initialScale: 1,
  // O app tem tabela de valores: bloquear o zoom prejudicaria quem precisa dele.
  maximumScale: 5,
  // Ocupa a tela toda no celular, inclusive atrás do recorte da câmera.
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${onest.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
