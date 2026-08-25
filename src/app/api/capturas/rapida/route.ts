import { comSessao, corpo, exigir, ok } from "@/lib/api"
import { registrarCaptura } from "@/lib/captura"

export const dynamic = "force-dynamic"

/**
 * Anotação rápida feita de dentro do app ("mercado 52,30").
 *
 * Usa sessão em vez de chave: aqui já existe navegador logado, e obrigar o
 * usuário a criar chave para digitar no próprio app seria burocracia à toa.
 */
export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{ texto: string }>(requisicao)
  const texto = exigir(dados.texto, "Escreva o gasto").trim()

  const resultado = await registrarCaptura({
    larId: sessao.larId,
    texto,
    origem: "MANUAL",
    textoLivre: true,
  })

  return ok(resultado, 201)
})
