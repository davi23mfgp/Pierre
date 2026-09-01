import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso } from "@/lib/api"
import { lojaDoLar } from "@/lib/loja/dados"
import { situacaoDoProduto } from "@/lib/loja/estoque"
import type { Movimento, TipoMovimento } from "@/lib/loja/estoque"

/** Prateleira: saldo, custo e margem de cada produto. */
export const GET = comSessao(async (sessao) => {
  const loja = await lojaDoLar(sessao.larId)

  const produtos = await prisma.produtoLoja.findMany({
    where: { lojaId: loja.id, ativo: true },
    orderBy: { nome: "asc" },
    include: { movimentos: { orderBy: { criadoEm: "asc" } } },
  })

  const prateleira = produtos.map((produto) => {
    const movimentos: Movimento[] = produto.movimentos.map((linha) => ({
      tipo: linha.tipo as TipoMovimento,
      quantidade: linha.quantidade,
      custoUnitarioCentavos: linha.custoUnitarioCentavos,
      criadoEm: linha.criadoEm,
    }))

    return {
      id: produto.id,
      nome: produto.nome,
      precoCentavos: produto.precoCentavos,
      ...situacaoDoProduto({ precoCentavos: produto.precoCentavos, movimentos }),
    }
  })

  return ok({
    prateleira,
    // Contagens prontas para a tela não ter de recalcular e divergir.
    acabando: prateleira.filter((linha) => linha.acabando).length,
    semSaldo: prateleira.filter((linha) => linha.semSaldo).length,
    semCusto: prateleira.filter((linha) => linha.custoMedioCentavos === null).length,
  })
})

/**
 * Lança entrada de mercadoria ou contagem física.
 *
 * A saída não entra aqui: ela nasce da venda, no balcão. Deixar registrar saída
 * à mão abriria caminho para o saldo divergir do que foi vendido, e aí a
 * prateleira deixa de servir para conferir a loja.
 */
export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    produtoId: string
    tipo: "ENTRADA" | "AJUSTE"
    quantidade: number
    custoUnitarioCentavos?: number
    motivo?: string
  }>(requisicao)

  const loja = await lojaDoLar(sessao.larId)

  const produto = await prisma.produtoLoja.findFirst({
    where: { id: dados.produtoId, lojaId: loja.id },
  })
  if (!produto) throw new ErroDeUso("Produto não encontrado nesta loja.", 404)

  if (dados.tipo !== "ENTRADA" && dados.tipo !== "AJUSTE") {
    throw new ErroDeUso("A saída do estoque vem da venda, não do lançamento à mão.")
  }

  const quantidade = Math.trunc(dados.quantidade)
  if (!Number.isFinite(quantidade) || quantidade < 0) {
    throw new ErroDeUso("Informe a quantidade.")
  }
  if (dados.tipo === "ENTRADA" && quantidade === 0) {
    throw new ErroDeUso("Entrada de zero peça não muda nada.")
  }

  const movimento = await prisma.movimentoEstoque.create({
    data: {
      produtoId: produto.id,
      tipo: dados.tipo,
      quantidade,
      custoUnitarioCentavos: dados.tipo === "ENTRADA" ? (dados.custoUnitarioCentavos ?? 0) : 0,
      motivo: dados.motivo ?? null,
    },
  })

  // O custo do produto acompanha a última entrada com custo informado: é o que
  // a tela de venda mostra como referência de margem no momento de dar desconto.
  if (dados.tipo === "ENTRADA" && (dados.custoUnitarioCentavos ?? 0) > 0) {
    await prisma.produtoLoja.update({
      where: { id: produto.id },
      data: { custoCentavos: dados.custoUnitarioCentavos as number },
    })
  }

  return ok({ movimento }, 201)
})
