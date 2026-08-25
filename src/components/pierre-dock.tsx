"use client"

import { useRef, useState } from "react"
import { Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface Turno {
  papel: "USUARIO" | "PIERRE"
  texto: string
}

const SUGESTOES = [
  "Quanto eu tenho hoje?",
  "Onde foi meu dinheiro este mês?",
  "Quando eu saio do vermelho?",
  "Vale a pena pegar 10 mil em 24x a 2,5%?",
]

/**
 * Conversa com o Pierre, presente em todas as telas.
 *
 * A resposta chega em streaming quando vem do modelo e de uma vez quando vem do
 * motor de regras. O componente trata os dois casos pelo Content-Type: JSON é
 * resposta pronta, texto puro é fluxo.
 */
export function PierreDock() {
  const [aberto, setAberto] = useState(false)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [pergunta, setPergunta] = useState("")
  const [pensando, setPensando] = useState(false)
  const conversaId = useRef<string | null>(null)
  const fim = useRef<HTMLDivElement>(null)

  async function perguntar(texto: string) {
    if (!texto.trim() || pensando) return

    setTurnos((atual) => [...atual, { papel: "USUARIO", texto }])
    setPergunta("")
    setPensando(true)

    try {
      const resposta = await fetch("/api/pierre/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto, conversaId: conversaId.current }),
      })

      const idDaConversa = resposta.headers.get("X-Conversa-Id")
      if (idDaConversa) conversaId.current = idDaConversa

      if (resposta.headers.get("Content-Type")?.includes("application/json")) {
        const dados = await resposta.json()
        if (dados.conversaId) conversaId.current = dados.conversaId
        setTurnos((atual) => [...atual, { papel: "PIERRE", texto: dados.texto ?? dados.erro }])
      } else if (resposta.body) {
        // O turno do Pierre entra vazio e vai crescendo: assim o texto aparece
        // conforme chega, em vez de a tela ficar parada até o fim.
        setTurnos((atual) => [...atual, { papel: "PIERRE", texto: "" }])
        const leitor = resposta.body.getReader()
        const decodificador = new TextDecoder()

        for (;;) {
          const { done, value } = await leitor.read()
          if (done) break
          const pedaco = decodificador.decode(value, { stream: true })
          setTurnos((atual) => {
            const copia = [...atual]
            copia[copia.length - 1] = { papel: "PIERRE", texto: copia[copia.length - 1].texto + pedaco }
            return copia
          })
          fim.current?.scrollIntoView({ behavior: "smooth" })
        }
      }
    } catch {
      setTurnos((atual) => [...atual, { papel: "PIERRE", texto: "Não consegui responder agora. Tente de novo." }])
    } finally {
      setPensando(false)
      fim.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-ios-blue/30 bg-ios-blue/10 px-4 py-3 text-[13px] font-medium text-ios-blue shadow-apple-float backdrop-blur-xl transition hover:bg-ios-blue/20"
      >
        <Sparkles className="h-4 w-4" />
        Conversar com o Pierre
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-40 flex h-[min(560px,80vh)] w-full flex-col border-l border-t border-hairline bg-surface-1 backdrop-blur-xl sm:bottom-6 sm:right-6 sm:h-[560px] sm:w-[420px] sm:rounded-3xl sm:border">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-ios-green" />
          Pierre
        </div>
        <button onClick={() => setAberto(false)} className="text-muted-fg hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turnos.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-fg">
              Trabalho com os seus números. Pergunte à vontade:
            </p>
            {SUGESTOES.map((sugestao) => (
              <button
                key={sugestao}
                onClick={() => perguntar(sugestao)}
                className="block w-full rounded-2xl border border-hairline px-3 py-2 text-left text-sm transition hover:border-ios-blue/40 hover:text-ios-blue"
              >
                {sugestao}
              </button>
            ))}
          </div>
        )}

        {turnos.map((turno, indice) => (
          <div
            key={indice}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
              turno.papel === "USUARIO"
                ? "ml-auto bg-ios-blue/15 text-ios-blue"
                : "bg-surface-2 text-foreground",
            )}
          >
            {turno.texto || "…"}
          </div>
        ))}

        {pensando && <p className="text-[12px] text-muted-fg">Pierre está calculando…</p>}
        <div ref={fim} />
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          perguntar(pergunta)
        }}
        className="border-t border-hairline p-3"
      >
        <input
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          placeholder="Pergunte sobre suas finanças…"
          className="w-full rounded-full border border-hairline bg-background px-4 py-2.5 text-sm outline-none focus:border-ios-blue/50"
        />
      </form>
    </div>
  )
}
