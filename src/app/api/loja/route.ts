import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok } from "@/lib/api"
import { caixaAberto, lojaDoLar, regrasDeRecebimento } from "@/lib/loja/dados"
import { resumoDoCaixa } from "@/lib/loja/venda"
import type { FormaPagamento } from "@/lib/loja/venda"

/**
 * Estado da loja: o que a tela de balcão precisa para abrir.
 *
 * Vem tudo junto de propósito. Três chamadas separadas fariam a tela montar em
 * pedaços, e balcão de loja não tem paciência para tela que pisca.
 */
export const GET = comSessao(async (sessao) => {
  const loja = await lojaDoLar(sessao.larId)

  const [produtos, regras, caixa, ultimasVendas] = await Promise.all([
    prisma.produtoLoja.findMany({
      where: { lojaId: loja.id, ativo: true },
      orderBy: { nome: "asc" },
      take: 200,
    }),
    regrasDeRecebimento(loja.id),
    caixaAberto(loja.id),
    prisma.vendaLoja.findMany({
      where: { lojaId: loja.id, cancelada: false },
      orderBy: { criadoEm: "desc" },
      take: 20,
      include: { pagamentos: true, itens: true, cliente: true },
    }),
  ])

  const vendasDoCaixa = caixa
    ? await prisma.vendaLoja.findMany({
        where: { caixaId: caixa.id, cancelada: false },
        include: { pagamentos: true },
      })
    : []

  return ok({
    loja,
    produtos,
    regras,
    caixa: caixa
      ? {
          ...caixa,
          resumo: resumoDoCaixa({
            aberturaCentavos: caixa.aberturaCentavos,
            vendas: vendasDoCaixa.map((venda) => ({
              formas: venda.pagamentos.map((pagamento) => ({
                forma: pagamento.forma as FormaPagamento,
                valorCentavos: pagamento.valorCentavos,
              })),
            })),
            sangriasCentavos: caixa.sangrias.map((sangria) => sangria.valorCentavos),
          }),
        }
      : null,
    ultimasVendas,
  })
})

/** Renomeia a loja e grava a taxa e o prazo de cada forma de pagamento. */
export const PUT = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    nome?: string
    endereco?: string
    regras?: { forma: FormaPagamento; taxaBps: number; prazoDias: number }[]
  }>(requisicao)

  const loja = await lojaDoLar(sessao.larId)

  if (dados.nome !== undefined || dados.endereco !== undefined) {
    await prisma.loja.update({
      where: { id: loja.id },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.endereco !== undefined ? { endereco: dados.endereco } : {}),
      },
    })
  }

  for (const regra of dados.regras ?? []) {
    await prisma.formaRecebimento.upsert({
      where: { lojaId_forma: { lojaId: loja.id, forma: regra.forma } },
      update: { taxaBps: regra.taxaBps, prazoDias: regra.prazoDias },
      create: { lojaId: loja.id, forma: regra.forma, taxaBps: regra.taxaBps, prazoDias: regra.prazoDias },
    })
  }

  return ok({ atualizado: true })
})
