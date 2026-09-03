import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso } from "@/lib/api"
import { lojaDoLar } from "@/lib/loja/dados"

type Contexto = { params: Promise<{ id: string }> }

/**
 * Edita o NCM do produto.
 *
 * Só o NCM por enquanto: é o único campo que a emissão de nota fiscal exige e
 * que não tinha onde ser preenchido (nome e preço nascem certos na venda,
 * corrigir os dois é tela separada, para quando alguém pedir).
 */
export const PATCH = comSessao<Contexto>(async (sessao, requisicao, contexto) => {
  const { id } = await contexto.params
  const dados = await corpo<{ ncm?: string }>(requisicao)

  const loja = await lojaDoLar(sessao.larId)
  const produto = await prisma.produtoLoja.findFirst({ where: { id, lojaId: loja.id } })
  if (!produto) throw new ErroDeUso("Produto não encontrado nesta loja.", 404)

  const ncm = dados.ncm?.replace(/\D/g, "") || null
  if (ncm && ncm.length !== 8) throw new ErroDeUso("NCM tem 8 dígitos.")

  return ok(await prisma.produtoLoja.update({ where: { id }, data: { ncm } }))
})
