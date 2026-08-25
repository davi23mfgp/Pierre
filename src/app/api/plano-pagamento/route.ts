import { prisma } from "@/lib/prisma"
import { comSessao, ok } from "@/lib/api"
import { competenciaAtual } from "@/lib/datas"
import { montarPlanoPagamento, type AlvoPagamento } from "@/lib/pierre/plano-pagamento"
import { compromissosFuturos } from "@/lib/parcelamentos"
import { montarPanorama } from "@/lib/pierre/panorama"

/**
 * Plano de "ir pagando".
 *
 * Junta conta negativa, faturas de cartão, dívidas cadastradas e parcelas
 * futuras num roteiro único. Os juros do cheque especial e do rotativo entram
 * por padrão em patamares de mercado quando o usuário não informou o dele —
 * subestimar aqui esconde justamente a dívida mais cara.
 */
const JUROS_PADRAO = {
  /// Cheque especial: teto de 8% ao mês definido pelo Banco Central.
  chequeEspecial: 800,
  /// Rotativo do cartão costuma passar de 14% ao mês.
  rotativo: 1400,
}

export const GET = comSessao(async (sessao, requisicao) => {
  const url = new URL(requisicao.url)
  const competencia = url.searchParams.get("competencia") ?? competenciaAtual()

  const [panorama, dividas, compromissos, contas] = await Promise.all([
    montarPanorama(sessao.larId, competencia),
    prisma.divida.findMany({ where: { larId: sessao.larId, quitada: false } }),
    compromissosFuturos(sessao.larId, 36),
    prisma.conta.findMany({ where: { larId: sessao.larId, arquivada: false } }),
  ])

  const alvos: AlvoPagamento[] = []

  // Contas com dívida vinculada (cheque especial cadastrado) entram só uma vez:
  // o saldo negativo da conta e a dívida são o mesmo dinheiro, e somar os dois
  // dobraria o valor a pagar.
  const contasComDivida = new Set(dividas.map((divida) => divida.contaId).filter(Boolean))

  for (const saldo of panorama.saldoPorConta) {
    if (saldo.saldoCentavos >= 0 || contasComDivida.has(saldo.id)) continue
    const cartao = saldo.tipo === "CARTAO_CREDITO"
    alvos.push({
      id: saldo.id,
      nome: cartao ? `Fatura ${saldo.nome}` : `${saldo.nome} (cheque especial)`,
      tipo: cartao ? "FATURA" : "CHEQUE_ESPECIAL",
      saldoCentavos: Math.abs(saldo.saldoCentavos),
      // Fatura paga integral não cobra juro; o rotativo só nasce se ela não for
      // paga, e aí vira uma dívida própria.
      jurosMensalBps: cartao ? 0 : JUROS_PADRAO.chequeEspecial,
      minimoMensalCentavos: 0,
    })
  }

  for (const divida of dividas) {
    alvos.push({
      id: divida.id,
      nome: divida.credor,
      tipo: divida.tipo === "CARTAO_ROTATIVO" ? "ROTATIVO" : "EMPRESTIMO",
      saldoCentavos: divida.saldoDevedorCentavos,
      jurosMensalBps: divida.jurosMensalBps || (divida.tipo === "CARTAO_ROTATIVO" ? JUROS_PADRAO.rotativo : 0),
      minimoMensalCentavos: divida.parcelaCentavos,
    })
  }

  const parcelasPorCompetencia = Object.fromEntries(
    compromissos.map((linha) => [linha.competencia, linha.totalCentavos]),
  )

  const renda = panorama.medias.receitaCentavos || panorama.mes.receitasCentavos
  // Custo de vida exclui as parcelas: elas entram separadas, senão seriam
  // contadas duas vezes e o plano mostraria uma sobra que não existe.
  const custoDeVida = Math.max(0, panorama.medias.despesaCentavos - (parcelasPorCompetencia[competencia] ?? 0))

  const plano = montarPlanoPagamento({
    competenciaInicial: competencia,
    alvos,
    rendaMensalCentavos: renda,
    custoDeVidaMensalCentavos: custoDeVida,
    parcelasPorCompetencia,
  })

  return ok({
    plano,
    entrada: { rendaMensalCentavos: renda, custoDeVidaMensalCentavos: custoDeVida, alvos },
    compromissos,
    contasNegativas: contas.length,
  })
})
