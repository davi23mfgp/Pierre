/**
 * Camada de modelo do Bean.
 *
 * Só é chamada quando o motor de regras não sabe responder. Opcional: sem
 * ANTHROPIC_API_KEY o app continua funcionando inteiro, apenas com respostas
 * de regra — nenhuma tela depende disto.
 */

import Anthropic from "@anthropic-ai/sdk"
import type { BetaMessageParam, BetaTextBlock } from "@anthropic-ai/sdk/resources/beta/messages"

import type { Panorama } from "@/lib/bean-counter/panorama"
import { PERSONA, contextoParaModelo, type RespostaAssistente } from "@/lib/bean-counter/chat"

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5"

/// Deixa o servidor escolher um modelo alternativo quando o pedido é recusado
/// por classificador, em vez de a conversa morrer com uma resposta vazia.
const BETAS = ["server-side-fallback-2026-07-01"]

export function modeloDisponivel(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

let cliente: Anthropic | null = null
function obterCliente(): Anthropic {
  if (!cliente) cliente = new Anthropic()
  return cliente
}

export interface TurnoConversa {
  papel: "USUARIO" | "ASSISTENTE"
  texto: string
}

function montarMensagens(historico: TurnoConversa[], pergunta: string, panorama: Panorama): BetaMessageParam[] {
  const mensagens: BetaMessageParam[] = historico.map((turno) => ({
    role: turno.papel === "USUARIO" ? "user" : "assistant",
    content: turno.texto,
  }))

  // O panorama entra junto da pergunta, não no system: ele muda a cada
  // lançamento, e no system invalidaria o prefixo em cache toda vez.
  mensagens.push({
    role: "user",
    content: `<panorama_financeiro>\n${contextoParaModelo(panorama)}\n</panorama_financeiro>\n\n${pergunta}`,
  })

  return mensagens
}

/** Parâmetros comuns às duas formas de chamada. */
function parametros(historico: TurnoConversa[], pergunta: string, panorama: Panorama) {
  return {
    model: MODELO,
    max_tokens: 4000,
    // A persona é fixa: marcá-la para cache economiza a releitura dela a cada
    // mensagem da conversa.
    system: [{ type: "text" as const, text: PERSONA, cache_control: { type: "ephemeral" as const } }],
    thinking: { type: "adaptive" as const },
    output_config: { effort: "medium" as const },
    betas: BETAS,
    fallbacks: "default" as const,
    messages: montarMensagens(historico, pergunta, panorama),
  }
}

/** Resposta completa de uma vez. Usada quando a tela não precisa de streaming. */
export async function responderComModelo(params: {
  pergunta: string
  panorama: Panorama
  historico?: TurnoConversa[]
}): Promise<RespostaAssistente> {
  const resposta = await obterCliente().beta.messages.create(
    parametros(params.historico ?? [], params.pergunta, params.panorama),
  )

  // Recusa vem com HTTP 200 e conteúdo vazio: sem este teste, o usuário veria
  // uma resposta em branco sem entender o motivo.
  if (resposta.stop_reason === "refusal") {
    return {
      texto: "Não consigo responder isso. Se for sobre suas finanças, pode reformular que eu tento de novo.",
      fonte: "modelo",
    }
  }

  const texto = resposta.content
    .filter((bloco): bloco is BetaTextBlock => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("\n")
    .trim()

  return { texto: texto || "Não consegui formular uma resposta agora. Tente perguntar de outro jeito.", fonte: "modelo" }
}

/**
 * Resposta em streaming, para o chat mostrar o texto conforme sai.
 * Devolve um ReadableStream de texto puro, consumido pela rota da API.
 */
export function responderComModeloStream(params: {
  pergunta: string
  panorama: Panorama
  historico?: TurnoConversa[]
  /// Chamado com o texto completo quando o fluxo termina — é onde a rota grava
  /// a mensagem no banco sem precisar remontar os pedaços.
  aoConcluir?: (textoCompleto: string) => Promise<void> | void
}): ReadableStream<Uint8Array> {
  const codificador = new TextEncoder()

  return new ReadableStream({
    async start(controlador) {
      let completo = ""
      try {
        const fluxo = obterCliente().beta.messages.stream(
          parametros(params.historico ?? [], params.pergunta, params.panorama),
        )

        fluxo.on("text", (pedaco) => {
          completo += pedaco
          controlador.enqueue(codificador.encode(pedaco))
        })

        await fluxo.finalMessage()
        await params.aoConcluir?.(completo)
      } catch (erro) {
        // O fluxo já foi aberto: lançar aqui deixaria a tela com meia resposta e
        // nenhuma explicação. Melhor terminar o texto dizendo o que houve.
        const mensagem =
          erro instanceof Anthropic.RateLimitError
            ? "\n\n[Muitas perguntas em pouco tempo. Tente de novo em instantes.]"
            : "\n\n[Falha ao falar com o assistente. Os números do painel continuam corretos.]"
        controlador.enqueue(codificador.encode(mensagem))
      } finally {
        controlador.close()
      }
    },
  })
}
