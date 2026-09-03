"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  Flag,
  LineChart,
  ListOrdered,
  NotebookPen,
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
  Wallet,
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

interface Secao {
  titulo: string
  itens: Item[]
}

interface Grupo {
  titulo: string
  /// Lista simples. Para grupo com legendas internas (ver "Mais"), usa `secoes`
  /// em vez disto — os dois nunca vêm preenchidos ao mesmo tempo.
  itens: Item[]
  secoes?: Secao[]
}

/** Itens de um grupo, venham eles soltos ou dentro de seções. */
function itensDoGrupo(grupo: Grupo): Item[] {
  return grupo.secoes ? grupo.secoes.flatMap((secao) => secao.itens) : grupo.itens
}

/**
 * O menu curto.
 *
 * Vinte telas de uma vez paralisam quem abriu o app para responder uma
 * pergunta simples. Ficam à mostra só as que se abre toda semana; o resto vive
 * atrás de "Mais ferramentas", que abre quando alguém procura.
 *
 * Nenhuma tela foi removida — sumir com endereço quebra link salvo e quebra
 * quem já aprendeu o caminho. Elas saíram da primeira vista, não do app.
 */
const DIARIO: Item[] = [
  { rota: "/painel", rotulo: "Visão geral", Icone: BarChart3 },
  { rota: "/capturas", rotulo: "Anotar", Icone: Zap },
  { rota: "/transacoes", rotulo: "Transações", Icone: Receipt },
  { rota: "/cartoes", rotulo: "Cartões", Icone: CreditCard },
  { rota: "/analise", rotulo: "Análise", Icone: PieChart },
]

/** As quatro decisões que o app existe para ajudar a tomar. */
const PLANEJAMENTO: Item[] = [
  { rota: "/orcamento", rotulo: "Orçamento", Icone: Target },
  { rota: "/dividas", rotulo: "Dívidas", Icone: Flag },
  { rota: "/metas", rotulo: "Metas", Icone: Target },
  { rota: "/investir", rotulo: "Longo prazo", Icone: Sprout },
]

/** O que se usa de vez em quando, e não precisa ocupar espaço todo dia. */
const FERRAMENTAS: Item[] = [
  { rota: "/plano", rotulo: "Plano de pagamento", Icone: Flag },
  { rota: "/parcelamentos", rotulo: "Parcelamentos", Icone: ListOrdered },
  { rota: "/projecao", rotulo: "Projeção", Icone: LineChart },
  { rota: "/simulador", rotulo: "Simulador", Icone: Wand2 },
  { rota: "/emprestimos", rotulo: "Empréstimo", Icone: CreditCard },
  { rota: "/recorrencias", rotulo: "Contas fixas", Icone: Repeat },
  { rota: "/regras", rotulo: "Regras", Icone: Tags },
  { rota: "/importar", rotulo: "Importar", Icone: Upload },
]

/**
 * "Decidir" e "Ferramentas" viraram um grupo só, com legenda interna em vez
 * de acordeão próprio.
 *
 * Três grupos de nível — Dia a dia, Decidir, Ferramentas — competindo por
 * atenção é justamente o "muita opção" que confunde quem não é do ramo
 * financeiro. Dois grupos (Dia a dia + Mais) deixa só uma escolha de nível
 * alto para quem chega, sem tirar nenhuma tela do lugar — as doze telas de
 * antes continuam todas aqui, só que atrás de um clique a menos de ruído.
 */
const MAIS: Secao[] = [
  { titulo: "Decidir", itens: PLANEJAMENTO },
  { titulo: "Ferramentas", itens: FERRAMENTAS },
]

const LOJA: Item[] = [
  { rota: "/loja", rotulo: "Balcão", Icone: ShoppingBag },
  { rota: "/loja/estoque", rotulo: "Prateleira", Icone: Package },
  { rota: "/loja/fiado", rotulo: "Fiado", Icone: NotebookPen },
  { rota: "/loja/contas", rotulo: "Contas a pagar", Icone: Receipt },
  { rota: "/loja/financas", rotulo: "Finanças da loja", Icone: Wallet },
  { rota: "/mei", rotulo: "MEI e DAS", Icone: Store },
]

/**
 * Atalhos da barra inferior no celular.
 *
 * Quatro, mais o botão que abre o resto: é o que cabe com área de toque
 * confortável em tela de 375px.
 */
const NO_POLEGAR: Item[] = [
  { rota: "/painel", rotulo: "Início", Icone: BarChart3 },
  { rota: "/capturas", rotulo: "Anotar", Icone: Zap },
  { rota: "/analise", rotulo: "Análise", Icone: PieChart },
  { rota: "/cartoes", rotulo: "Cartões", Icone: CreditCard },
]

/// Fora de quem só opera o balcão (funcionário) e fora da barra do polegar no
/// modo empresa (ver abaixo): MEI/DAS (tributário do dono) e Finanças da loja
/// (lucro/DRE) — mesmo corte de `src/lib/acesso.ts`, que é quem barra de
/// verdade por URL. Aqui é só o menu não oferecer o que a URL já recusaria
/// para o funcionário, e não gastar o espaço caro do polegar com o que se
/// abre menos no dia a dia do balcão.
const ROTAS_MENOS_FREQUENTES_DA_LOJA = ["/mei", "/loja/financas"]
const LOJA_NO_DIA_A_DIA = LOJA.filter((item) => !ROTAS_MENOS_FREQUENTES_DA_LOJA.includes(item.rota))

/// Funcionário não tem "Início" (é o painel pessoal do dono) nem "Anotar" (é
/// captura de gasto pessoal) — as quatro telas de loja cabem certinho no lugar.
/// O dono no modo empresa usa a mesma barra: é o mesmo recorte de "o que se
/// abre toda hora no balcão", só que ele ainda chega no resto pelo "Tudo".
const NO_POLEGAR_LOJA: Item[] = LOJA_NO_DIA_A_DIA

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

/**
 * Os grupos do menu, um aberto por vez.
 *
 * Vinte opções abertas ao mesmo tempo é o cardápio com trinta sabores de pizza:
 * a pessoa lê tudo, não escolhe nada e sai. Com um grupo aberto por vez ela
 * enxerga cinco opções, escolhe, e o resto continua a um toque de distância.
 *
 * O grupo da tela atual abre sozinho. Chegar por link e não achar onde está no
 * menu é o tipo de coisa que faz alguém achar que o app perdeu a página.
 */
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
  const grupoDaTela = grupos.find((grupo) => itensDoGrupo(grupo).some((item) => estaAtivo(caminho, item.rota)))
  const [aberto, setAberto] = useState(() => grupoDaTela?.titulo ?? grupos[0]?.titulo ?? "")

  useEffect(() => {
    const atual = grupos.find((grupo) => itensDoGrupo(grupo).some((item) => estaAtivo(caminho, item.rota)))
    if (atual) setAberto(atual.titulo)
  }, [caminho, grupos])

  // Recolhido só há ícones, e esconder metade deles atrás de um acordeão que
  // não se vê seria pior que mostrar todos.
  if (recolhido) {
    return (
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {grupos.map((grupo) => (
          <div key={grupo.titulo} className="space-y-0.5">
            {itensDoGrupo(grupo).map((item) => (
              <Linha key={item.rota} item={item} caminho={caminho} recolhido aoNavegar={aoNavegar} />
            ))}
          </div>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {grupos.map((grupo) => {
        const estaAberto = aberto === grupo.titulo
        const temAtivo = itensDoGrupo(grupo).some((item) => estaAtivo(caminho, item.rota))

        return (
          <div key={grupo.titulo}>
            <button
              onClick={() => setAberto(estaAberto ? "" : grupo.titulo)}
              aria-expanded={estaAberto}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors",
                temAtivo ? "text-foreground" : "text-muted-fg hover:text-foreground",
              )}
            >
              <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", !estaAberto && "-rotate-90")} />
              <span className="truncate">{grupo.titulo}</span>
              {!estaAberto && temAtivo && <span className="ml-auto size-1.5 rounded-full bg-positivo" />}
            </button>

            {estaAberto && (
              <div className="mb-2 space-y-2.5 pl-1.5">
                {grupo.secoes
                  ? grupo.secoes.map((secao) => (
                      <div key={secao.titulo} className="space-y-0.5">
                        <p className="px-2.5 text-[10px] uppercase tracking-[0.1em] text-muted-fg/70">
                          {secao.titulo}
                        </p>
                        {secao.itens.map((item) => (
                          <Linha key={item.rota} item={item} caminho={caminho} recolhido={false} aoNavegar={aoNavegar} />
                        ))}
                      </div>
                    ))
                  : grupo.itens.map((item) => (
                      <Linha key={item.rota} item={item} caminho={caminho} recolhido={false} aoNavegar={aoNavegar} />
                    ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/** Pessoal ↔ Empresa. Só existe pra quem tem loja — sem loja não há o que trocar. */
function AlternadorDeModo({ empresa, ir }: { empresa: boolean; ir: (destino: "pessoal" | "empresa") => void }) {
  return (
    <div className="flex rounded-full border border-pauta p-0.5 text-[11px]">
      <button
        onClick={() => ir("pessoal")}
        className={cn(
          "flex-1 rounded-full px-2.5 py-1 transition-colors",
          !empresa ? "bg-foreground/[0.08] font-medium text-foreground" : "text-muted-fg hover:text-foreground",
        )}
      >
        Pessoal
      </button>
      <button
        onClick={() => ir("empresa")}
        className={cn(
          "flex-1 rounded-full px-2.5 py-1 transition-colors",
          empresa ? "bg-foreground/[0.08] font-medium text-foreground" : "text-muted-fg hover:text-foreground",
        )}
      >
        Empresa
      </button>
    </div>
  )
}

export function Navegacao({ mei, apenasLoja }: { mei?: boolean; apenasLoja?: boolean }) {
  const caminho = usePathname()
  const router = useRouter()
  const [recolhido, setRecolhido] = useState(false)
  const [gaveta, setGaveta] = useState(false)

  /**
   * Pessoal ou empresa — sem estado próprio, sem `localStorage`.
   *
   * Deriva direto da URL: chegar em `/loja` (ou `/mei`) por link, aba salva ou
   * pelo botão abaixo dá o mesmo resultado. Guardar isso num estado à parte
   * arriscaria o menu mostrar "Empresa" com a tela pessoal aberta atrás —
   * dois lugares dizendo coisas diferentes sobre a mesma pergunta.
   */
  const modoEmpresa = Boolean(mei) && !apenasLoja && (caminho === "/mei" || caminho.startsWith("/loja"))

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

  /**
   * Os grupos do menu.
   *
   * Funcionário da loja não vê os outros grupos nem no menu — coerente com o
   * que `src/proxy.ts` já barra por URL. Esconder só o que a URL também barra
   * evita um menu que promete tela que a pessoa não consegue abrir.
   *
   * Dono com loja nunca vê pessoal e empresa juntos: no modo empresa é só
   * "Tino PJ_MEI"; no pessoal, nem aparece que existe uma loja. É a mesma
   * separação que o funcionário já tinha, só que reversível e para o próprio
   * dono — dois assuntos diferentes, duas telas de cada vez, nunca as duas
   * misturadas competindo por atenção no mesmo menu.
   */
  const grupos: Grupo[] = useMemo(() => {
    if (apenasLoja) return [{ titulo: "Balcão", itens: LOJA_NO_DIA_A_DIA }]
    if (modoEmpresa) return [{ titulo: "Tino PJ_MEI", itens: LOJA }]

    return [
      { titulo: "Dia a dia", itens: DIARIO },
      { titulo: "Mais", itens: [], secoes: MAIS },
    ]
  }, [apenasLoja, modoEmpresa])

  // Trocar de modo é navegar, não só marcar um estado — a rota de chegada é
  // quem decide o modo (ver `modoEmpresa` acima). Empurra pra tela mais usada
  // de cada lado: o balcão na empresa, a visão geral no pessoal.
  function irPara(destino: "pessoal" | "empresa") {
    router.push(destino === "empresa" ? "/loja" : "/painel")
  }

  const tituloDoApp = modoEmpresa ? "Tino PJ_MEI" : "Tino"

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
          {!recolhido && <span className="font-display text-[15px] font-semibold tracking-tight">{tituloDoApp}</span>}
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

        {mei && !apenasLoja && !recolhido && (
          <div className="px-3 pt-3">
            <AlternadorDeModo empresa={modoEmpresa} ir={irPara} />
          </div>
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
              <span className="font-display text-[15px] font-semibold">{tituloDoApp}</span>
              <button
                onClick={() => setGaveta(false)}
                aria-label="Fechar menu"
                className="toque ml-auto text-muted-fg"
              >
                <X className="size-4" />
              </button>
            </header>
            {mei && !apenasLoja && (
              <div className="border-b border-pauta px-3 py-3">
                <AlternadorDeModo
                  empresa={modoEmpresa}
                  ir={(destino) => {
                    setGaveta(false)
                    irPara(destino)
                  }}
                />
              </div>
            )}
            <Grupos grupos={grupos} caminho={caminho} recolhido={false} aoNavegar={() => setGaveta(false)} />
          </aside>
        </>
      )}

      {/* ── Barra do polegar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pauta bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex items-stretch justify-around">
          {(apenasLoja || modoEmpresa ? NO_POLEGAR_LOJA : NO_POLEGAR).map((item) => {
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
