"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, Square } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Ditar um gasto.
 *
 * "Mercado cinquenta e dois e trinta" vira lançamento sem teclado. É o jeito
 * mais rápido de anotar com a sacola na mão, saindo do caixa.
 *
 * Usa o reconhecimento de voz do próprio navegador, e não um serviço de
 * transcrição. Três motivos: não custa nada por minuto falado, não manda o áudio
 * do usuário para terceiro nenhum, e funciona sem chave de API — num app que vai
 * ser vendido, cada um desses seria conta a pagar ou termo a explicar.
 *
 * O preço disso é suporte desigual: Chrome e Android reconhecem bem, Firefox
 * não tem, e no iOS depende da versão. Quando não há suporte o botão simplesmente
 * não aparece, em vez de aparecer e falhar no toque.
 */

/** O tipo não está no lib padrão do TypeScript; só o que este componente usa. */
interface ReconhecimentoDeFala extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((evento: { results: { transcript: string }[][] & { length: number } }) => void) | null
  onerror: ((evento: { error: string }) => void) | null
  onend: (() => void) | null
}

function construtorDeFala(): (new () => ReconhecimentoDeFala) | null {
  if (typeof window === "undefined") return null
  const janela = window as unknown as {
    SpeechRecognition?: new () => ReconhecimentoDeFala
    webkitSpeechRecognition?: new () => ReconhecimentoDeFala
  }
  return janela.SpeechRecognition ?? janela.webkitSpeechRecognition ?? null
}

export function DitarGasto({
  aoTranscrever,
  className,
}: {
  /** Recebe o texto falado. Quem chama decide o que fazer com ele. */
  aoTranscrever: (texto: string) => void
  className?: string
}) {
  const [suportado, setSuportado] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [parcial, setParcial] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const motor = useRef<ReconhecimentoDeFala | null>(null)

  useEffect(() => {
    setSuportado(construtorDeFala() !== null)
    return () => motor.current?.stop()
  }, [])

  const parar = useCallback(() => {
    motor.current?.stop()
    setOuvindo(false)
  }, [])

  function ouvir() {
    const Construtor = construtorDeFala()
    if (!Construtor) return

    setErro(null)
    setParcial("")

    const reconhecimento = new Construtor()
    reconhecimento.lang = "pt-BR"
    reconhecimento.continuous = false
    // O parcial aparece enquanto a pessoa fala: sem ele, o botão fica mudo por
    // segundos e parece travado.
    reconhecimento.interimResults = true

    reconhecimento.onresult = (evento) => {
      let texto = ""
      for (let i = 0; i < evento.results.length; i += 1) texto += evento.results[i][0].transcript
      setParcial(texto)
    }

    reconhecimento.onerror = (evento) => {
      setErro(
        evento.error === "not-allowed"
          ? "Preciso da permissão do microfone. Libere nas configurações do navegador."
          : "Não consegui ouvir. Tente de novo, ou escreva.",
      )
      setOuvindo(false)
    }

    reconhecimento.onend = () => {
      setOuvindo(false)
      setParcial((texto) => {
        if (texto.trim()) aoTranscrever(texto.trim())
        return ""
      })
    }

    motor.current = reconhecimento
    reconhecimento.start()
    setOuvindo(true)
  }

  if (!suportado) return null

  return (
    <div className={className}>
      <button
        type="button"
        onClick={ouvindo ? parar : ouvir}
        aria-label={ouvindo ? "Parar de gravar" : "Ditar um gasto"}
        className={cn(
          "toque flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] transition-colors",
          ouvindo
            ? "border-negativo bg-negativo/10 text-negativo"
            : "border-pauta text-muted-fg hover:border-positivo/50 hover:text-foreground",
        )}
      >
        {ouvindo ? <Square className="size-4" /> : <Mic className="size-4" />}
        {ouvindo ? "ouvindo… toque para parar" : "ditar"}
      </button>

      {parcial && <p className="mt-2 text-[13px] italic text-muted-fg">“{parcial}”</p>}
      {erro && <p className="mt-2 text-[13px] text-negativo">{erro}</p>}
    </div>
  )
}
