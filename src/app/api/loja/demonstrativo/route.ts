import { prisma } from "@/lib/prisma"
import { comSessao, ok } from "@/lib/api"
import { lojaDoLar } from "@/lib/loja/dados"
import { resumirLoja } from "@/lib/loja/resumo"
import { custoMedioCentavos } from "@/lib/loja/estoque"
import type { Movimento, TipoMovimento } from "@/lib/loja/estoque"
import { demonstrativoDaLoja } from "@/lib/loja/demonstrativo"

/**
 * DRE da loja: receita líquida, CMV e despesa, só do que é da loja.
 *
 * Nunca lê `Conta` nem `Transacao` — a separação do pessoal vem de nascença,
 * não de um filtro (ver comentário em `src/lib/loja/demonstrativo.ts`).
 */
export const GET = comSessao(async (sessao, requisicao) => {
  const loja = await lojaDoLar(sessao.larId)
  const dias = Number(new URL(requisicao.url).searchParams.get("dias") ?? 30)
  const desde = new Date(Date.now() - dias * 86_400_000)

  const [vendas, produtos, saidas, despesas] = await Promise.all([
    prisma.vendaLoja.findMany({
      where: { lojaId: loja.id, cancelada: false, criadoEm: { gte: desde } },
      include: { pagamentos: true },
    }),
    prisma.produtoLoja.findMany({
      where: { lojaId: loja.id },
      include: { movimentos: { orderBy: { criadoEm: "asc" } } },
    }),
    prisma.movimentoEstoque.findMany({
      where: { tipo: "SAIDA", criadoEm: { gte: desde }, produto: { lojaId: loja.id } },
      select: { produtoId: true, quantidade: true },
    }),
    prisma.contaDaLoja.findMany({
      where: { lojaId: loja.id, paga: true, pagaEm: { gte: desde } },
      select: { valorCentavos: true },
    }),
  ])

  // Custo da saída não vem gravado nela (fica zero, ver schema.prisma) — usa o
  // custo médio atual do produto, mesma referência que a Prateleira mostra na
  // margem. Não é o custo exato do dia da venda, é o mesmo compromisso que o
  // resto do app já faz.
  const custoMedioPorProduto = new Map(
    produtos.map((produto) => {
      const movimentos: Movimento[] = produto.movimentos.map((linha) => ({
        tipo: linha.tipo as TipoMovimento,
        quantidade: linha.quantidade,
        custoUnitarioCentavos: linha.custoUnitarioCentavos,
        criadoEm: linha.criadoEm,
      }))
      return [produto.id, custoMedioCentavos(movimentos)]
    }),
  )

  const demonstrativo = demonstrativoDaLoja({
    receitaLiquidaCentavos: resumirLoja(vendas).liquidoCentavos,
    saidasDeEstoque: saidas.map((saida) => ({
      quantidade: saida.quantidade,
      custoUnitarioCentavos: custoMedioPorProduto.get(saida.produtoId) ?? null,
    })),
    despesasPagasCentavos: despesas.map((despesa) => despesa.valorCentavos),
  })

  return ok({ demonstrativo, dias })
})
