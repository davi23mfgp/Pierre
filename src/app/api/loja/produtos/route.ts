import { prisma } from "@/lib/prisma"
import { comSessao, corpo, exigir, ok } from "@/lib/api"
import { lojaDoLar } from "@/lib/loja/dados"

export const GET = comSessao(async (sessao, requisicao) => {
  const loja = await lojaDoLar(sessao.larId)
  const busca = new URL(requisicao.url).searchParams.get("busca")?.trim()

  const produtos = await prisma.produtoLoja.findMany({
    where: {
      lojaId: loja.id,
      ativo: true,
      ...(busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {}),
    },
    orderBy: { nome: "asc" },
    take: 100,
  })

  return ok({ produtos })
})

/**
 * Cadastra um produto.
 *
 * Nome e preço bastam. Exigir custo, código de barras e categoria antes da
 * primeira venda é o que faz sistema de loja ser abandonado no primeiro sábado
 * cheio — o resto entra depois, com calma.
 */
export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    nome: string
    precoCentavos: number
    custoCentavos?: number
    codigoBarras?: string
  }>(requisicao)

  const loja = await lojaDoLar(sessao.larId)

  const produto = await prisma.produtoLoja.create({
    data: {
      lojaId: loja.id,
      nome: exigir(dados.nome, "Informe o nome do produto").trim(),
      precoCentavos: dados.precoCentavos ?? 0,
      custoCentavos: dados.custoCentavos ?? 0,
      codigoBarras: dados.codigoBarras?.trim() || null,
    },
  })

  return ok({ produto }, 201)
})
