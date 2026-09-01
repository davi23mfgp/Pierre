"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CreditCard,
  Flag,
  LineChart,
  ListOrdered,
  PieChart,
  Receipt,
  Repeat,
  Store,
  Tags,
  Target,
  Upload,
  Wand2,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Navegação em duas fileiras.
 *
 * A primeira é o dia a dia: onde estou, o que gastei, o que anotar. A segunda é
 * o planejamento, que se abre menos vezes. Uma fileira só com quinze itens vira
 * rolagem horizontal infinita onde nada é achado.
 */
const DIARIO = [
  { rota: "/painel", rotulo: "Visão geral", Icone: BarChart3 },
  { rota: "/analise", rotulo: "Análise", Icone: PieChart },
  { rota: "/capturas", rotulo: "Anotar", Icone: Zap },
  { rota: "/transacoes", rotulo: "Transações", Icone: Receipt },
  { rota: "/cartoes", rotulo: "Cartões", Icone: CreditCard },
  { rota: "/parcelamentos", rotulo: "Parcelamentos", Icone: ListOrdered },
]

const PLANEJAMENTO = [
  { rota: "/orcamento", rotulo: "Orçamento", Icone: Target },
  { rota: "/dividas", rotulo: "Dívidas", Icone: Flag },
  { rota: "/plano", rotulo: "Plano de pagamento", Icone: Flag },
  { rota: "/simulador", rotulo: "Simulador", Icone: Wand2 },
  { rota: "/projecao", rotulo: "Projeção", Icone: LineChart },
  { rota: "/emprestimos", rotulo: "Empréstimo", Icone: CreditCard },
  { rota: "/metas", rotulo: "Metas", Icone: Target },
  { rota: "/recorrencias", rotulo: "Contas fixas", Icone: Repeat },
  { rota: "/regras", rotulo: "Regras", Icone: Tags },
  { rota: "/importar", rotulo: "Importar", Icone: Upload },
]

function Fileira({ itens, caminho }: { itens: typeof DIARIO; caminho: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {itens.map(({ rota, rotulo, Icone }) => {
        // startsWith cobre subrotas (/transacoes/123) sem marcar tudo em "/".
        const ativo = caminho === rota || caminho.startsWith(`${rota}/`)
        return (
          <Link
            key={rota}
            href={rota}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] transition-colors",
              ativo
                ? "border-acao/40 bg-acao/10 text-acao"
                : "border-pauta text-muted-fg hover:text-foreground",
            )}
          >
            <Icone className="size-4" />
            {rotulo}
          </Link>
        )
      })}
    </div>
  )
}

/**
 * Atalhos da barra inferior no celular.
 *
 * Cinco, porque é o que cabe com área de toque confortável em tela de 375px —
 * e são as cinco telas abertas todo dia. O resto continua acessível pelas
 * fileiras, que no celular ficam abaixo do conteúdo principal.
 */
const NO_POLEGAR = [
  { rota: "/painel", rotulo: "Início", Icone: BarChart3 },
  { rota: "/capturas", rotulo: "Anotar", Icone: Zap },
  { rota: "/analise", rotulo: "Análise", Icone: PieChart },
  { rota: "/cartoes", rotulo: "Cartões", Icone: CreditCard },
  { rota: "/plano", rotulo: "Plano", Icone: Flag },
]

export function Navegacao({ mei }: { mei?: boolean }) {
  const caminho = usePathname()
  const planejamento = mei ? [...PLANEJAMENTO, { rota: "/mei", rotulo: "MEI", Icone: Store }] : PLANEJAMENTO

  return (
    <>
      {/* Duas fileiras de pílulas comiam um terço da tela do celular antes de
          qualquer número aparecer. No telefone elas somem e a navegação vai
          para a barra inferior, ao alcance do polegar. */}
      <nav className="sticky top-0 z-30 -mx-4 mb-6 hidden space-y-1.5 border-b border-pauta bg-background/80 px-4 py-3 backdrop-blur-xl sm:block">
        <Fileira itens={DIARIO} caminho={caminho} />
        <Fileira itens={planejamento} caminho={caminho} />
      </nav>

      <nav className="mb-4 sm:hidden">
        <Fileira itens={[...DIARIO, ...planejamento]} caminho={caminho} />
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pauta bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <div className="flex items-stretch justify-around">
          {NO_POLEGAR.map(({ rota, rotulo, Icone }) => {
            const ativo = caminho === rota || caminho.startsWith(`${rota}/`)
            return (
              <Link
                key={rota}
                href={rota}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                  ativo ? "text-acao" : "text-muted-fg",
                )}
              >
                <Icone className="size-5" />
                {rotulo}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
