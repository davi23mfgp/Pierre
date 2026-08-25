import { redirect } from "next/navigation"

import { getSessao } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navegacao } from "@/components/navegacao"
import { PierreDock } from "@/components/pierre-dock"
import { BarraTopo } from "@/components/barra-topo"

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao()
  if (!sessao) redirect("/login")

  const lar = await prisma.lar.findUnique({
    where: { id: sessao.larId },
    select: { onboardingEm: true, meiPerfil: { select: { id: true } } },
  })

  // Lar apagado com token ainda válido: manda para o login em vez de estourar.
  // A mesma checagem existe em `sessaoDaPagina`, porque o Next renderiza layout
  // e página em paralelo e a página consulta o banco por conta própria.
  if (!lar) redirect("/login?sessao=invalida")

  // Painel vazio não diz nada a quem acabou de chegar. Antes de mostrar
  // qualquer tela, o Pierre pergunta o essencial — e o usuário pode pular.
  if (!lar.onboardingEm) redirect("/bem-vindo")

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-32 sm:pb-28">
      <BarraTopo nome={sessao.nome} />
      <Navegacao mei={Boolean(lar.meiPerfil)} />
      <main className="animate-page-enter">{children}</main>
      <PierreDock />
    </div>
  )
}
