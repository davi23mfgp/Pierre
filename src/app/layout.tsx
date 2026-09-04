import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, Onest } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

/**
 * Duas famílias, três trabalhos.
 *
 * Onest para título e para corpo. É uma grotesca geométrica de terminais
 * horizontais e caixa alta curta — o mesmo lugar em que a San Francisco da
 * Apple mora, e a mais próxima dela entre as que dá para auto-hospedar. Uma
 * família só nos dois papéis é escolha, não economia: no iOS a hierarquia vem
 * de tamanho e peso, não de trocar de letra a cada nível. O título usa o mesmo
 * desenho em peso maior e entrelinha curta.
 *
 * A terceira existe por motivo funcional, não estético: dinheiro precisa de
 * algarismo tabular. Sem largura fixa por dígito, a coluna de valores dança
 * conforme o número e conferir extrato vira caça ao erro.
 *
 * As três vêm pelo `next/font`: o build baixa os arquivos e serve pelo próprio
 * domínio, sem requisição a fonts.gstatic.com em tempo de execução.
 */
const display = Onest({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

const corpo = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-corpo",
  display: "swap",
})

const numero = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-numero",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Tino, seu contador pessoal",
  description:
    "Organize contas, dívidas e metas em um lugar só. Projeção de caixa, plano de pagamento e ajuda para decidir empréstimo. Para pessoa física e MEI.",
  manifest: "/manifest.webmanifest",
  // Instalado na tela inicial do celular, o app abre sem barra de navegador.
  appleWebApp: { capable: true, title: "Tino", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icones/icone-192.png", sizes: "192x192" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1d24" },
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
      <body
        className={`${display.variable} ${corpo.variable} ${numero.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
