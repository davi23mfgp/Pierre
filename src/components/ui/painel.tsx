import { cn } from "@/lib/utils"

/**
 * Blocos de tela do Tino.
 *
 * A `.ficha` é o cartão do livro-caixa: papel, uma linha de pauta no topo e
 * nada mais. Todo valor sai em fonte de largura fixa com algarismo tabular —
 * sem isso a coluna de números dança conforme o dígito e conferir extrato vira
 * caça ao erro.
 */

export function Cartao({
  children,
  className,
  titulo,
  acao,
}: {
  children: React.ReactNode
  className?: string
  titulo?: string
  acao?: React.ReactNode
}) {
  return (
    <section className={cn("ficha p-5", className)}>
      {(titulo || acao) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-[15px] font-semibold text-foreground">{titulo}</h2>}
          {acao && <div className="shrink-0 text-[13px] text-acao">{acao}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

type Tom = "neutro" | "positivo" | "negativo" | "atencao"

/** Cor semântica. Cinza para número neutro: só o que exige atenção ganha cor. */
export const TOM: Record<Tom, string> = {
  neutro: "text-foreground",
  positivo: "text-positivo",
  negativo: "text-negativo",
  atencao: "text-atencao",
}

export function Metrica({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
}: {
  rotulo: string
  valor: string
  detalhe?: string
  tom?: Tom
}) {
  return (
    <div className="rounded-2xl border border-pauta bg-papel-2 px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-widest text-muted-fg">{rotulo}</p>
      <p className={cn("numero mt-1.5 text-[25px] font-semibold leading-none", TOM[tom])}>{valor}</p>
      {detalhe && <p className="mt-1.5 text-[12px] leading-snug text-muted-fg">{detalhe}</p>}
    </div>
  )
}

/** Barra de progresso. Acima de 100% fica vermelha — é o sinal de estouro. */
export function Barra({ percentual, tom }: { percentual: number; tom?: "verde" | "ambar" | "vermelho" }) {
  const limitado = Math.max(0, Math.min(100, percentual))
  const cor =
    tom === "vermelho" || percentual > 100
      ? "bg-negativo"
      : tom === "ambar" || percentual >= 80
        ? "bg-atencao"
        : "bg-positivo"

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
      <div className={cn("h-full rounded-full transition-all duration-500", cor)} style={{ width: `${limitado}%` }} />
    </div>
  )
}

export function Vazio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-pauta px-4 py-10 text-center">
      <p className="text-[14px] font-medium text-foreground">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-muted-fg">{texto}</p>}
    </div>
  )
}

/** Aviso destacado. Usa cor só quando o conteúdo exige ação. */
export function Aviso({
  children,
  tom = "atencao",
}: {
  children: React.ReactNode
  tom?: "atencao" | "critico" | "info"
}) {
  const estilo = {
    critico: "border-negativo/40 bg-negativo/10 text-negativo",
    atencao: "border-atencao/40 bg-atencao/10 text-atencao",
    info: "border-pauta bg-papel-2 text-muted-fg",
  }[tom]

  return <p className={cn("rounded-2xl border p-3 text-[13px] leading-relaxed", estilo)}>{children}</p>
}
