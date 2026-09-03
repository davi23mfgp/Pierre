import { comSessao, ok } from "@/lib/api"
import { buscarNcm } from "@/lib/loja/ncm"
import tabelaNcm from "@/lib/loja/ncm-dados.json"

/**
 * Busca de NCM pra preencher o produto.
 *
 * A tabela (10.515 códigos, Resolução Gecex nº 926/2026 — ver
 * scripts/gerar-ncm.mjs) fica só no servidor. O cliente recebe os poucos
 * resultados da busca, nunca a lista inteira.
 */
export const GET = comSessao(async (_sessao, requisicao) => {
  const busca = new URL(requisicao.url).searchParams.get("busca") ?? ""
  return ok({ resultados: buscarNcm(tabelaNcm, busca, 15) })
})
