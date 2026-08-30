import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso } from "@/lib/api"
import { caixaAberto, lojaDoLar, proximoNumero, regrasDeRecebimento, somarNoFaturamentoMei } from "@/lib/loja/dados"
import { calcularPagamento, conferirVenda, totalDaVenda } from "@/lib/loja/venda"
import type { FormaPagamento, ItemDaVenda, PagamentoInformado } from "@/lib/loja/venda"

export const GET = comSessao(async (sessao, requisicao) => {
  const loja = await lojaDoLar(sessao.larId)
  const url = new URL(requisicao.url)
  const limite = Math.min(200, Number(url.searchParams.get("limite") ?? 50) || 50)

  const vendas = await prisma.vendaLoja.findMany({
    where: { lojaId: loja.id },
    orderBy: { criadoEm: "desc" },
    take: limite,
    include: { itens: true, pagamentos: true, cliente: true },
  })

  return ok({ vendas })
})

/**
 * Registra a venda do balcão.
 *
 * O cálculo inteiro é refeito aqui a partir dos itens e das regras gravadas —
 * nada de confiar em total que veio da tela. Cliente adultera requisição, e
 * numa loja isso seria venda registrada por menos do que foi cobrado.
 */
export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    itens: (ItemDaVenda & { produtoId?: string })[]
    pagamentos: PagamentoInformado[]
    descontoCentavos?: number
    clienteNome?: string
    clienteTelefone?: string
    observacao?: string
  }>(requisicao)

  if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
    throw new ErroDeUso("A venda precisa de pelo menos um item.")
  }
  if (!Array.isArray(dados.pagamentos) || dados.pagamentos.length === 0) {
    throw new ErroDeUso("Informe como o cliente pagou.")
  }

  const loja = await lojaDoLar(sessao.larId)
  const [regras, caixa] = await Promise.all([regrasDeRecebimento(loja.id), caixaAberto(loja.id)])

  const totalCentavos = totalDaVenda(dados.itens, dados.descontoCentavos ?? 0)
  const conferencia = conferirVenda(totalCentavos, dados.pagamentos)

  if (!conferencia.fechada) {
    throw new ErroDeUso(
      `Falta ${(conferencia.faltaCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} para fechar a venda.`,
    )
  }

  const temFiado = dados.pagamentos.some((pagamento) => pagamento.forma === "FIADO")
  if (temFiado && !dados.clienteNome) {
    // Fiado sem nome é o caderno de novo: dívida que ninguém sabe cobrar.
    throw new ErroDeUso("Fiado precisa do nome de quem levou.")
  }

  const vendidoEm = new Date()

  const cliente = dados.clienteNome
    ? await prisma.clienteLoja.create({
        data: { lojaId: loja.id, nome: dados.clienteNome, telefone: dados.clienteTelefone ?? null },
      })
    : null

  const calculados = dados.pagamentos.map((pagamento) => calcularPagamento(pagamento, regras, vendidoEm))

  const venda = await prisma.vendaLoja.create({
    data: {
      lojaId: loja.id,
      caixaId: caixa?.id ?? null,
      clienteId: cliente?.id ?? null,
      numero: await proximoNumero(loja.id),
      totalCentavos,
      descontoCentavos: dados.descontoCentavos ?? 0,
      observacao: dados.observacao ?? null,
      criadoEm: vendidoEm,
      itens: {
        create: dados.itens.map((item) => ({
          produtoId: item.produtoId ?? null,
          descricao: item.descricao,
          quantidade: Math.max(1, Math.trunc(item.quantidade)),
          precoUnitarioCentavos: item.precoUnitarioCentavos,
          totalCentavos: Math.max(1, Math.trunc(item.quantidade)) * item.precoUnitarioCentavos,
        })),
      },
      pagamentos: {
        create: calculados.map((pagamento) => ({
          forma: pagamento.forma as FormaPagamento,
          valorCentavos: pagamento.valorCentavos,
          taxaBps: pagamento.taxaBps,
          valorLiquidoCentavos: pagamento.valorLiquidoCentavos,
          previsaoRecebimentoEm: pagamento.previsaoRecebimentoEm,
          parcelas: pagamento.parcelas,
        })),
      },
    },
    include: { itens: true, pagamentos: true, cliente: true },
  })

  // O faturamento do MEI conta a venda, não o recebimento: para o limite anual
  // vale o que foi vendido na competência, mesmo que o cartão caia mês que vem.
  await somarNoFaturamentoMei(sessao.larId, vendidoEm, totalCentavos)

  return ok({ venda, troco: conferencia.trocoCentavos }, 201)
})
