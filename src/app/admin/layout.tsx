import Link from "next/link"

import { sessaoDeAdmin } from "@/lib/admin"

/**
 * Casca do painel de administração.
 *
 * Fora do grupo `(app)` de propósito: o admin não é uma tela do produto. Ele
 * não tem barra do polegar, não tem alerta financeiro, não passa pelo
 * onboarding — e não deve herdar nada disso por engano quando o layout do app
 * mudar.
 *
 * A guarda fica aqui **e** em cada página. O Next renderiza layout e página em
 * paralelo: só o layout redirecionando não impede a página de consultar o banco
 * antes. É a mesma razão pela qual `sessaoDaPagina` existe ao lado do layout do
 * app.
 */

const ABAS = [
  { rota: "/admin", rotulo: "Visão geral" },
  { rota: "/admin/contas", rotulo: "Contas" },
  { rota: "/admin/pagamentos", rotulo: "Pagamentos" },
  { rota: "/admin/suporte", rotulo: "Suporte" },
  { rota: "/admin/configuracoes", rotulo: "Configurações" },
]

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoDeAdmin()

  return (
    <div className="area-do-app min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <header className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-fg">Tino — administração</p>
            <h1 className="text-xl font-semibold tracking-tight">{sessao.nome.split(" ")[0]}, o negócio</h1>
          </div>
          <Link href="/painel" className="text-[13px] text-muted-fg hover:text-foreground">
            voltar ao app
          </Link>
        </header>

        <nav className="mb-5 flex flex-wrap gap-1.5 border-b border-pauta pb-3">
          {ABAS.map((aba) => (
            <Link
              key={aba.rota}
              href={aba.rota}
              className="rounded-full border border-pauta px-3.5 py-1.5 text-[13px] text-muted-fg transition-colors hover:border-acao/40 hover:text-foreground"
            >
              {aba.rotulo}
            </Link>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  )
}
