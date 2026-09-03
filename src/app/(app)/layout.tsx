import { redirect } from "next/navigation"

import { getSessao } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navegacao } from "@/components/navegacao"
import { TinoDock } from "@/components/tino-dock"
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

  const apenasLoja = sessao.papel === "FUNCIONARIO_LOJA"

  // Painel vazio não diz nada a quem acabou de chegar. Antes de mostrar
  // qualquer tela, o Tino pergunta o essencial — e o usuário pode pular.
  //
  // O funcionário da loja nunca cai aqui: essa conversa é sobre a vida
  // pessoal do dono, e `middleware.ts` barra `/bem-vindo` para esse papel —
  // sem a exceção abaixo, um lar sem onboarding feito entraria em loop de
  // redirecionamento (layout manda para lá, middleware manda de volta).
  if (!lar.onboardingEm && !apenasLoja) redirect("/bem-vindo")

  return (
    <div className="area-do-app min-h-screen">
      <Navegacao mei={Boolean(lar.meiPerfil)} apenasLoja={apenasLoja} />

      <div className="mx-auto w-full max-w-6xl px-4 pb-28 md:pb-10">
        <BarraTopo nome={sessao.nome} />
        <main className="animate-page-enter">{children}</main>
      </div>

      <TinoDock />
    </div>
  )
}
