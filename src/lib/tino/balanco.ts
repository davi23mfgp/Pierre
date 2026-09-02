import { prisma } from "@/lib/prisma"
import { competenciaAtual, fimDaCompetencia, ultimasCompetencias } from "@/lib/datas"

/**
 * Balanço mês a mês.
 *
 * O balanço de uma data só diz onde você está. A série diz se você está
 * andando para frente — que é a pergunta real: dá para terminar o mês com mais
 * dinheiro em conta e mesmo assim mais pobre, se a dívida cresceu mais que o
 * saldo.
 *
 * **O que é reconstruído e o que não é.** Saldo em conta e parcelamentos têm
 * data em cada linha, então o passado é calculável de verdade. Dívida cadastrada
 * à mão e saldo de meta não têm histórico no banco — só existe o valor de hoje.
 * Em vez de repetir o valor de hoje para trás, o que faria a série mentir uma
 * melhora ou uma piora que não houve, esses dois ficam de fora da série e a
 * tela diz isso.
 */

export interface MesDoBalanco {
  competencia: string
  /// Dinheiro em conta no último dia do mês, somando só o que é positivo.
  disponivelCentavos: number
  /// Cheque especial e fatura em aberto no fim do mês.
  aDescobertoCentavos: number
  /// Parcelas ainda por vencer no fim daquele mês.
  parceladoCentavos: number
  passivoCentavos: number
  patrimonioLiquidoCentavos: number
}

export interface BalancoMensal {
  serie: MesDoBalanco[]
  /// Variação do patrimônio entre o primeiro e o último mês da série.
  variacaoCentavos: number
  /// O que não entra na série, para a tela poder dizer.
  foraDaSerie: string[]
}

/**
 * Monta a série dos últimos meses.
 *
 * O saldo de cada mês é a soma de tudo que entrou e saiu até o último dia dele
 * — derivado, como todo saldo neste app. Recalcular do zero a cada mês é mais
 * lento que guardar um acumulado, mas é o que garante que a série feche com o
 * extrato; um acumulado gravado diverge no primeiro lançamento retroativo.
 */
export async function balancoMensal(larId: string, meses = 12): Promise<BalancoMensal> {
  const competencias = ultimasCompetencias(meses, competenciaAtual())

  const [transacoes, parcelas] = await Promise.all([
    prisma.transacao.findMany({
      where: { larId, conta: { tipo: { not: "CARTAO_CREDITO" } } },
      select: { data: true, valorCentavos: true, tipo: true },
      orderBy: { data: "asc" },
    }),
    prisma.parcelaCompra.findMany({
      where: { parcelamento: { larId }, paga: false },
      select: { vencimento: true, valorCentavos: true },
    }),
  ])

  const serie: MesDoBalanco[] = competencias.map((competencia) => {
    const ultimoDia = fimDaCompetencia(competencia)

    // Transferência não entra: ela move dinheiro entre contas do mesmo dono e
    // somá-la contaria o mesmo real duas vezes.
    const saldo = transacoes
      .filter((linha) => linha.data <= ultimoDia && linha.tipo !== "TRANSFERENCIA")
      .reduce((soma, linha) => soma + (linha.tipo === "RECEITA" ? linha.valorCentavos : -linha.valorCentavos), 0)

    const parcelado = parcelas
      .filter((parcela) => parcela.vencimento > ultimoDia)
      .reduce((soma, parcela) => soma + parcela.valorCentavos, 0)

    const disponivel = Math.max(0, saldo)
    const aDescoberto = Math.abs(Math.min(0, saldo))
    const passivo = aDescoberto + parcelado

    return {
      competencia,
      disponivelCentavos: disponivel,
      aDescobertoCentavos: aDescoberto,
      parceladoCentavos: parcelado,
      passivoCentavos: passivo,
      patrimonioLiquidoCentavos: disponivel - passivo,
    }
  })

  const primeiro = serie[0]?.patrimonioLiquidoCentavos ?? 0
  const ultimo = serie[serie.length - 1]?.patrimonioLiquidoCentavos ?? 0

  return {
    serie,
    variacaoCentavos: ultimo - primeiro,
    foraDaSerie: [
      "o que está guardado em metas",
      "dívidas cadastradas à mão",
      "fatura de cartão ainda não fechada",
    ],
  }
}

