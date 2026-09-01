"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CreditCard,
  Flag,
  LineChart,
  ListOrdered,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Receipt,
  Repeat,
  ShoppingBag,
  Sprout,
  Store,
  Tags,
  Target,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TinoMascote } from "@/components/tino-mascote"

/**
 * Navegação lateral.
 *
 * Quinze telas em pílulas viravam duas fileiras com rolagem horizontal, onde
 * nada era achado e um terço da tela ia embora antes do primeiro número. A
 * coluna resolve os dois: a lista inteira fica visível de uma vez, agrupada
 * pelo momento em que cada tela é aberta.
 *
 * No celular a coluna não cabe — ali vale a barra inferior, ao alcance do
 * polegar, com as cinco telas do dia a dia.
 */

interface Item {
  rota: string
  rotulo: string
  Icone: typeof BarChart3
}

interface Grupo {
  titulo: string
  itens: Item[]
}

/** O dia a dia: onde estou, o que gastei, o que anotar. */
const DIARIO: Item[] = [
  { rota: "/painel", rotulo: "Visão geral", Icone: BarChart3 },
  { rota: "/analise", rotulo: "Análise", Icone: PieChart },
  { rota: "/capturas", rotulo: "Anotar", Icone: Zap },
  { rota: "/transacoes", rotulo: "Transações", Icone: Receipt },
  { rota: "/cartoes", rotulo: "Cartões", Icone: CreditCard },
  { rota: "/parcelamentos", rotulo: "Parcelamentos", Icone: ListOrdered },
]

/** O que se abre uma vez por mês, ou quando há decisão para tomar. */
const PLANEJAMENTO: Item[] = [
  { rota: "/orcamento", rotulo: "Orçamento", Icone: Target },
  { rota: "/dividas", rotulo: "Dívidas", Icone: Flag },
  { rota: "/plano", rotulo: "Plano de pagamento", Icone: Flag },
  { rota: "/metas", rotulo: "Metas", Icone: Target },
  { rota: "/projecao", rotulo: "Projeção", Icone: LineChart },
  { rota: "/simulador", rotulo: "Simulador", Icone: Wand2 },
  { rota: "/emprestimos", rotulo: "Empréstimo", Icone: CreditCard },
  { rota: "/investir", rotulo: "Longo prazo", Icone: Sprout },
]

/** Ajustes que se faz uma vez e esquece. */
const AJUSTES: Item[] = [
  { rota: "/recorrencias", rotulo: "Contas fixas", Icone: Repeat },
  { rota: "/regras", rotulo: "Regras", Icone: Tags },
  { rota: "/importar", rotulo: "Importar", Icone: Upload },
]

const LOJA: Item[] = [
  { rota: "/mei", rotulo: "MEI", Icone: Store },
  { rota: "/loja", rotulo: "Balcão", Icone: ShoppingBag },
  { rota: "/loja/estoque", rotulo: "Prateleira", Icone: Package },
]

/**
 * Atalhos da barra inferior no celular.
 *
 * Cinco, porque é o que cabe com área de toque confortável em tela de 375px —
 * e são as cinco telas abertas todo dia.
 */
const NO_POLEGAR: Item[] = [
  { rota: "/painel", rotulo: "Início", Icone: BarChart3 },
  { rota: "/capturas", rotulo: "Anotar", Icone: Zap },
  { rota: "/analise", rotulo: "Análise", Icone: PieChart },
  { rota: "/cartoes", rotulo: "Cartões", Icone: CreditCard },
  { rota: "/plano", rotulo: "Plano", Icone: Flag },
]

const CHAVE_RECOLHIDO = "tino:menu-recolhido"

/**
 * Marca no `<html>` se a coluna está recolhida.
 *
 * O conteúdo desloca por CSS a partir daí. A alternativa seria descer o estado
 * por props até o layout, o que faria toda tela do app depender de um detalhe
 * do menu.
 */
function marcar(recolhido: boolean) {
  document.documentElement.dataset.menu = recolhido ? "recolhido" : "aberto"
}

/** startsWith cobre subrota (/transacoes/123) sem marcar tudo em "/". */
function estaAtivo(caminho: string, rota: string) {
  if (rota === "/loja") return caminho === "/loja"
  return caminho === rota || caminho.startsWith(`${rota}/`)
}

function Linha({
  item,
  caminho,
  recolhido,
  aoNavegar,
}: {
  item: Item
  caminho: string
  recolhido: boolean
  aoNavegar?: () => void
}) {
  const ativo = estaAtivo(caminho, item.rota)
  const { Icone } = item

  return (
    <Link
      href={item.rota}
      onClick={aoNavegar}
      title={recolhido ? item.rotulo : undefined}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg py-2 text-[13px] transition-colors",
        recolhido ? "justify-center px-0" : "px-2.5",
        ativo
          ? "bg-foreground/[0.07] font-medium text-foreground ring-1 ring-inset ring-pauta"
          : "text-muted-fg hover:bg-foreground/[0.04] hover:text-foreground",
      )}
    >
      <Icone className={cn("size-4 shrink-0", ativo && "text-positivo")} />
      {!recolhido && <span className="truncate">{item.rotulo}</span>}
    </Link>
  )
}

function Grupos({
  grupos,
  caminho,
  recolhido,
  aoNavegar,
}: {
  grupos: Grupo[]
  caminho: string
  recolhido: boolean
  aoNavegar?: () => void
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="space-y-0.5">
          {/* Recolhido, o título viraria três letras sem sentido; a separação
              fica por conta do espaço entre os blocos. */}
          {!recolhido && (
            <p className="px-2.5 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-fg">{grupo.titulo}</p>
          )}
          {grupo.itens.map((item) => (
            <Linha key={item.rota} item={item} caminho={caminho} recolhido={recolhido} aoNavegar={aoNavegar} />
          ))}
        </div>
      ))}
    </nav>
  )
}

export function Navegacao({ mei }: { mei?: boolean }) {
  const caminho = usePathname()
  const [recolhido, setRecolhido] = useState(false)
  const [gaveta, setGaveta] = useState(false)

  /**
   * A escolha de recolher fica guardada.
   *
   * Quem trabalha em tela pequena recolhe uma vez e espera continuar assim;
   * reabrir expandido a cada visita obriga a refazer o gesto todo dia.
   */
  useEffect(() => {
    let guardado = false
    try {
      guardado = localStorage.getItem(CHAVE_RECOLHIDO) === "1"
    } catch {
      /* navegador sem storage: começa expandido */
    }
    setRecolhido(guardado)
    marcar(guardado)
  }, [])

  function alternar() {
    setRecolhido((atual) => {
      const proximo = !atual
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, proximo ? "1" : "0")
      } catch {
        /* sem storage, vale só nesta sessão */
      }
      marcar(proximo)
      return proximo
    })
  }

  // Fecha a gaveta ao trocar de tela: no celular ela cobre o conteúdo, e ficar
  // aberta depois de navegar esconde justamente o que a pessoa foi ver.
  useEffect(() => {
    setGaveta(false)
  }, [caminho])

  const grupos: Grupo[] = [
    { titulo: "Dia a dia", itens: DIARIO },
    { titulo: "Planejamento", itens: PLANEJAMENTO },
    // A loja só aparece para quem é MEI: quem usa o Tino para as contas de casa
    // não tem balcão nem prateleira.
    ...(mei ? [{ titulo: "Loja", itens: LOJA }] : []),
    { titulo: "Ajustes", itens: AJUSTES },
  ]

  return (
    <>
      {/* ── Coluna fixa, do tablet para cima ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden shrink-0 flex-col border-r border-pauta bg-papel-1 transition-[width] duration-200 md:flex",
          recolhido ? "w-[68px]" : "w-[248px]",
        )}
      >
        <header
          className={cn(
            "flex h-14 items-center gap-2 border-b border-pauta",
            recolhido ? "justify-center px-2" : "px-3",
          )}
        >
          <TinoMascote estado="tranquilo" animado={false} className="size-7 shrink-0" />
          {!recolhido && <span className="font-display text-[15px] font-semibold tracking-tight">Tino</span>}
          <button
            onClick={alternar}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            className={cn("toque ml-auto text-muted-fg hover:text-foreground", recolhido && "hidden")}
          >
            <PanelLeftClose className="size-4" />
          </button>
        </header>

        {recolhido && (
          <button
            onClick={alternar}
            aria-label="Expandir menu"
            className="toque mx-auto mt-3 text-muted-fg hover:text-foreground"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        )}

        <Grupos grupos={grupos} caminho={caminho} recolhido={recolhido} />
      </aside>

      {/* ── Gaveta do celular ── */}
      {gaveta && (
        <>
          <button
            aria-label="Fechar menu"
            onClick={() => setGaveta(false)}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-pauta bg-papel-1 md:hidden">
            <header className="flex h-14 items-center gap-2 border-b border-pauta px-3">
              <TinoMascote estado="tranquilo" animado={false} className="size-7" />
              <span className="font-display text-[15px] font-semibold">Tino</span>
              <button
                onClick={() => setGaveta(false)}
                aria-label="Fechar menu"
                className="toque ml-auto text-muted-fg"
              >
                <X className="size-4" />
              </button>
            </header>
            <Grupos grupos={grupos} caminho={caminho} recolhido={false} aoNavegar={() => setGaveta(false)} />
          </aside>
        </>
      )}

      {/* ── Barra do polegar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pauta bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex items-stretch justify-around">
          {NO_POLEGAR.map((item) => {
            const ativo = estaAtivo(caminho, item.rota)
            const { Icone } = item
            return (
              <Link
                key={item.rota}
                href={item.rota}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                  ativo ? "text-positivo" : "text-muted-fg",
                )}
              >
                <Icone className="size-5" />
                {item.rotulo}
              </Link>
            )
          })}
          <button
            onClick={() => setGaveta(true)}
            aria-label="Abrir menu"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-fg"
          >
            <PanelLeftOpen className="size-5" />
            Tudo
          </button>
        </div>
      </nav>
    </>
  )
}
