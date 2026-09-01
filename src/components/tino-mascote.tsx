import { cn } from "@/lib/utils"

/**
 * O Tino.
 *
 * Corpo de bloco de anotação, fita de cupom saindo do topo e uma linha de pauta
 * atravessando o peito — os três objetos que aparecem em qualquer balcão de
 * loja e em qualquer mesa de contador. Não é um robô nem um porquinho: o
 * assunto aqui é papel conferido peça por peça.
 *
 * A expressão vem do estado real das contas, nunca de decoração. Se ele está
 * preocupado, é porque o número está ruim — o desenho é mais um jeito de dizer
 * a verdade, não um enfeite que sorri o tempo todo.
 */

export type EstadoTino = "tranquilo" | "atento" | "apertado" | "critico" | "comemorando" | "pensando"

const COR: Record<EstadoTino, string> = {
  tranquilo: "oklch(var(--lch-positivo))",
  atento: "oklch(var(--lch-atencao))",
  apertado: "oklch(var(--lch-atencao))",
  critico: "oklch(var(--lch-negativo))",
  comemorando: "oklch(var(--lch-positivo))",
  pensando: "oklch(var(--lch-dado))",
}

/** Uma frase por estado, na voz do produto: direta, sem drama e sem apelido. */
export const FRASE: Record<EstadoTino, string> = {
  tranquilo: "As contas fecham.",
  atento: "Tem coisa para olhar.",
  apertado: "O mês está apertado.",
  critico: "Precisa de decisão agora.",
  comemorando: "Meta batida.",
  pensando: "Conferindo os números…",
}

/** Sobrancelha: só aparece quando há o que estranhar. */
function Sobrancelhas({ estado }: { estado: EstadoTino }) {
  if (estado === "tranquilo" || estado === "comemorando") return null

  const inclinacao = estado === "critico" ? 9 : 5

  return (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
      <line x1="20" y1={30 - inclinacao / 2} x2="28" y2={30 + inclinacao / 2} />
      <line x1="44" y1={30 + inclinacao / 2} x2="36" y2={30 - inclinacao / 2} />
    </g>
  )
}

/** Boca: reta quando está tudo certo, curva conforme aperta ou melhora. */
function Boca({ estado }: { estado: EstadoTino }) {
  if (estado === "comemorando") {
    return <path d="M25 45 Q32 52 39 45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  }
  if (estado === "critico") {
    return <path d="M25 48 Q32 42 39 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  }
  if (estado === "apertado") {
    return <path d="M26 46 Q32 43 38 46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  }
  return <line x1="26" y1="46" x2="38" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
}

export function TinoMascote({
  estado = "tranquilo",
  className,
  animado = true,
}: {
  estado?: EstadoTino
  className?: string
  /** Desligue em lista, onde vários mascotes respirando viram ruído. */
  animado?: boolean
}) {
  const cor = COR[estado]

  return (
    <svg
      viewBox="0 0 64 74"
      role="img"
      aria-label={`Tino: ${FRASE[estado]}`}
      className={cn("text-foreground", animado && "motion-safe:animate-respiro", className)}
      style={{ animationDuration: estado === "critico" ? "1.6s" : undefined }}
    >
      {/* Fita de cupom: sai do topo e enrola, como a bobina da registradora. */}
      <path
        d="M32 14 C32 6 40 4 44 8 C47 11 44 15 41 13"
        fill="none"
        stroke={cor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Corpo: o bloco de anotação. */}
      <rect x="10" y="14" width="44" height="46" rx="9" fill="var(--papel-1)" stroke={cor} strokeWidth="2.4" />

      {/* Pauta do peito — a mesma linha que separa as fichas na tela. */}
      <line x1="10" y1="54" x2="54" y2="54" stroke={cor} strokeWidth="1.4" opacity="0.45" />

      <Sobrancelhas estado={estado} />

      {/* Olhos. Ao pensar, o direito vira uma vírgula: está lendo o número. */}
      {estado === "pensando" ? (
        <>
          <circle cx="25" cy="36" r="3.2" fill="currentColor" />
          <path d="M37 34 Q41 36 37 39" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="25" cy="36" r="3.2" fill="currentColor" />
          <circle cx="39" cy="36" r="3.2" fill="currentColor" />
        </>
      )}

      <Boca estado={estado} />

      {/* Pés: dois traços curtos, o suficiente para ele apoiar no papel. */}
      <g stroke={cor} strokeWidth="2.4" strokeLinecap="round">
        <line x1="22" y1="60" x2="22" y2="66" />
        <line x1="42" y1="60" x2="42" y2="66" />
      </g>
    </svg>
  )
}

/**
 * Traduz a classificação do diagnóstico para a expressão.
 *
 * Mora aqui, e não em cada tela, para o mascote não sorrir numa página e
 * franzir na outra com o mesmo dado por trás.
 */
export function estadoPorSaude(saude: string | null | undefined): EstadoTino {
  switch (saude) {
    case "SAUDAVEL":
      return "tranquilo"
    case "ATENCAO":
      return "atento"
    case "APERTADO":
      return "apertado"
    case "CRITICO":
      return "critico"
    default:
      return "pensando"
  }
}

/**
 * Expressão a partir dos alertas abertos.
 *
 * Um alerta CRITICO manda em tudo: não adianta o resto estar bom se o cheque
 * especial estourou. Sem alerta nenhum, o Tino fica tranquilo — o que só
 * acontece quando o motor de fato não achou nada, nunca por falta de dado.
 */
export function estadoPorAlertas(alertas: { severidade: string }[]): EstadoTino {
  if (alertas.some((alerta) => alerta.severidade === "CRITICO")) return "critico"
  if (alertas.some((alerta) => alerta.severidade === "ATENCAO")) return "atento"
  return "tranquilo"
}
