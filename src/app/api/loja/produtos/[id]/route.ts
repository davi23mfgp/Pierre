import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso } from "@/lib/api"
import { lojaDoLar } from "@/lib/loja/dados"
import { ncmValido } from "@/lib/loja/ncm"
import tabelaNcm from "@/lib/loja/ncm-dados.json"

type Contexto = { params: Promise<{ id: string }> }

/**
 * Edita o NCM do produto.
 *
 * Só o NCM por enquanto: é o único campo que a emissão de nota fiscal exige e
 * que não tinha onde ser preenchido (nome e preço nascem certos na venda,
 * corrigir os dois é tela separada, para quando alguém pedir).
 *
 * Confere contra a tabela oficial de verdade, não só o formato — 8 dígitos
 * quaisquer passavam antes, e um código que não existe faz a nota ser
 * rejeitada só na hora de emitir, quando já custou a tentativa.
 */
export const PATCH = comSessao<Contexto>(async (sessao, requisicao, contexto) => {
  const { id } = await contexto.params
  const dados = await corpo<{ ncm?: string }>(requisicao)

  const loja = await lojaDoLar(sessao.larId)
  const produto = await prisma.produtoLoja.findFirst({ where: { id, lojaId: loja.id } })
  if (!produto) throw new ErroDeUso("Produto não encontrado nesta loja.", 404)

  const ncm = dados.ncm?.replace(/\D/g, "") || null
  if (ncm && !ncmValido(tabelaNcm, ncm)) throw new ErroDeUso("Esse NCM não existe na tabela oficial.")

  return ok(await prisma.produtoLoja.update({ where: { id }, data: { ncm } }))
})
