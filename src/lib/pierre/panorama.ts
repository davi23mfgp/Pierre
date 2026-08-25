/**
 * Panorama — a foto financeira completa do lar num objeto só.
 *
 * É a fonte única de números do app: o painel, os alertas e o assistente leem
 * daqui. Ter um cálculo por tela é como o mesmo saldo aparece diferente em
 * dois lugares e o usuário perde a confiança no sistema inteiro.
 */

import { prisma } from "@/lib/prisma"
import {
  competenciaAtual,
  competenciaMaisMeses,
  distanciaEmMeses,
  janelaDoMes,
  ultimasCompetencias,
} from "@/lib/datas"
import {
  avaliarMei,
  compararEstrategias,
  mesesDeFolga,
  projetarAposentadoria,
  projetarFluxo,
  projetarMeta,
  reservaIdeal,
  type DividaEntrada,
} from "@/lib/financeiro"

export interface Panorama {
  lar: {
    id: string
    nome: string
    tipo: string
    diaInicioMes: number
    estrategiaDivida: "AVALANCHE" | "BOLA_DE_NEVE" | "PROPORCIONAL"
    mesesReserva: number
  }
  competencia: string
  saldoTotalCentavos: number
  saldoPorConta: { id: string; nome: string; tipo: string; saldoCentavos: number; limiteCentavos: number | null }[]
  mes: {
    receitasCentavos: number
    despesasCentavos: number
    sobraCentavos: number
    taxaPoupancaBps: number
    despesasPorCategoria: { categoriaId: string | null; nome: string; grupo: string; essencial: boolean; totalCentavos: number }[]
    despesasPorMembro: { membroId: string | null; nome: string; totalCentavos: number }[]
    aPagarCentavos: number
    naoCategorizadas: number
  }
  historico: { competencia: string; receitasCentavos: number; despesasCentavos: number; sobraCentavos: number }[]
  medias: {
    receitaCentavos: number
    despesaCentavos: number
    sobraCentavos: number
    custoFixoCentavos: number
    custoEssencialCentavos: number
    /// Soma do que os membros declararam ganhar. Usada como referência quando
    /// ainda não há receita lançada.
    rendaDeclaradaCentavos: number
  }
  orcamento: {
    competencia: string
    linhas: { categoriaId: string; nome: string; limiteCentavos: number; gastoCentavos: number; percentual: number; estourou: boolean }[]
    limiteTotalCentavos: number
    gastoTotalCentavos: number
  }
  metas: {
    id: string
    nome: string
    tipo: string
    alvoCentavos: number
    saldoCentavos: number
    percentual: number
    mesesRestantes: number | null
    aporteNecessarioCentavos: number
    aporteAtualCentavos: number
    noPrazo: boolean
    dataAlvo: Date | null
  }[]
  dividas: {
    lista: (DividaEntrada & { tipo: string; parcelasTotal: number | null; parcelasPagas: number; diaVencimento: number })[]
    totalCentavos: number
    parcelaMensalCentavos: number
    comprometimentoBps: number
    plano: ReturnType<typeof compararEstrategias> | null
  }
  reserva: {
    idealCentavos: number
    atualCentavos: number
    percentual: number
    mesesDeFolga: number
  }
  projecao: ReturnType<typeof projetarFluxo>
  aposentadoria: ReturnType<typeof projetarAposentadoria> | null
  mei: (ReturnType<typeof avaliarMei> & { dasEmAberto: string[]; proximoDasEm: Date | null }) | null
  recorrenciasProximas: { id: string; descricao: string; valorCentavos: number; tipo: string; proximaData: Date }[]
}

const bps = (parte: number, todo: number) => (todo <= 0 ? 0 : Math.round((parte / todo) * 10_000))

export async function montarPanorama(larId: string, competencia = competenciaAtual()): Promise<Panorama> {
  const lar = await prisma.lar.findUniqueOrThrow({
    where: { id: larId },
    include: { meiPerfil: true, membros: true },
  })

  const janela = janelaDoMes(competencia, lar.diaInicioMes)
  const historicoCompetencias = ultimasCompetencias(12, competencia)

  const [contas, transacoesMes, transacoesHistorico, orcamentos, metas, dividas, recorrencias, meiCompetencias] =
    await Promise.all([
      prisma.conta.findMany({ where: { larId, arquivada: false } }),
      prisma.transacao.findMany({
        where: { larId, data: { gte: janela.de, lte: janela.ate } },
        include: { categoria: true, membro: true },
      }),
      prisma.transacao.findMany({
        where: { larId, competencia: { in: historicoCompetencias } },
        include: { categoria: true },
      }),
      prisma.orcamento.findMany({ where: { larId, competencia }, include: { categoria: true } }),
      prisma.meta.findMany({ where: { larId, status: "ATIVA" }, orderBy: { prioridade: "desc" } }),
      prisma.divida.findMany({ where: { larId, quitada: false } }),
      prisma.recorrencia.findMany({ where: { larId, ativa: true }, orderBy: { proximaData: "asc" } }),
      lar.meiPerfil ? prisma.meiCompetencia.findMany({ where: { larId } }) : Promise.resolve([]),
    ])

  // ── Saldos ────────────────────────────────────────────────
  // Transferência nunca entra em receita ou despesa: as duas pontas se anulam
  // e contá-las inflaria receita e despesa no mesmo valor.
  const movimentosPorConta = await prisma.transacao.groupBy({
    by: ["contaId", "tipo"],
    where: { larId, pago: true, tipo: { in: ["RECEITA", "DESPESA"] } },
    _sum: { valorCentavos: true },
  })

  // Transferência não entra em receita nem em despesa — as duas pontas se
  // anulam no resultado do mês — mas move saldo entre contas. Sem contá-la
  // aqui, guardar dinheiro na poupança ou pagar a fatura do cartão não mudava
  // saldo nenhum, e a fatura ficava aberta para sempre.
  //
  // A direção vem do vínculo: a ponta de destino é a que aponta para a de
  // origem (`transferenciaParId`), como criado na rota de transações.
  const transferencias = await prisma.transacao.findMany({
    where: { larId, pago: true, tipo: "TRANSFERENCIA" },
    select: { contaId: true, valorCentavos: true, transferenciaParId: true },
  })

  const saldoPorConta = contas.map((conta) => {
    const entradas = movimentosPorConta.find((m) => m.contaId === conta.id && m.tipo === "RECEITA")?._sum.valorCentavos ?? 0
    const saidas = movimentosPorConta.find((m) => m.contaId === conta.id && m.tipo === "DESPESA")?._sum.valorCentavos ?? 0

    const movidoPorTransferencia = transferencias
      .filter((linha) => linha.contaId === conta.id)
      .reduce((soma, linha) => soma + (linha.transferenciaParId ? linha.valorCentavos : -linha.valorCentavos), 0)

    return {
      id: conta.id,
      nome: conta.nome,
      tipo: conta.tipo as string,
      saldoCentavos: conta.saldoInicialCentavos + entradas - saidas + movidoPorTransferencia,
      limiteCentavos: conta.limiteCentavos,
    }
  })

  // Cartão de crédito é dívida, não dinheiro disponível: somá-lo ao caixa
  // mostraria um saldo que a pessoa não tem.
  const saldoTotalCentavos = saldoPorConta
    .filter((conta) => conta.tipo !== "CARTAO_CREDITO")
    .reduce((soma, conta) => soma + conta.saldoCentavos, 0)

  // ── Mês corrente ──────────────────────────────────────────
  const doMes = transacoesMes.filter((t) => t.tipo !== "TRANSFERENCIA")
  const receitasMes = doMes.filter((t) => t.tipo === "RECEITA").reduce((s, t) => s + t.valorCentavos, 0)
  const despesasMes = doMes.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + t.valorCentavos, 0)

  const porCategoria = new Map<string, { categoriaId: string | null; nome: string; grupo: string; essencial: boolean; totalCentavos: number }>()
  for (const transacao of doMes.filter((t) => t.tipo === "DESPESA")) {
    const chave = transacao.categoriaId ?? "sem-categoria"
    const atual = porCategoria.get(chave) ?? {
      categoriaId: transacao.categoriaId,
      nome: transacao.categoria?.nome ?? "Sem categoria",
      grupo: transacao.categoria?.grupo ?? "OUTROS",
      essencial: transacao.categoria?.essencial ?? false,
      totalCentavos: 0,
    }
    atual.totalCentavos += transacao.valorCentavos
    porCategoria.set(chave, atual)
  }

  const porMembro = new Map<string, { membroId: string | null; nome: string; totalCentavos: number }>()
  for (const transacao of doMes.filter((t) => t.tipo === "DESPESA")) {
    const chave = transacao.membroId ?? "compartilhado"
    const atual = porMembro.get(chave) ?? {
      membroId: transacao.membroId,
      nome: transacao.membro?.nome ?? "Compartilhado",
      totalCentavos: 0,
    }
    atual.totalCentavos += transacao.valorCentavos
    porMembro.set(chave, atual)
  }

  // ── Histórico e médias ────────────────────────────────────
  const historico = historicoCompetencias.map((mes) => {
    const doPeriodo = transacoesHistorico.filter((t) => t.competencia === mes && t.tipo !== "TRANSFERENCIA")
    const receitas = doPeriodo.filter((t) => t.tipo === "RECEITA").reduce((s, t) => s + t.valorCentavos, 0)
    const despesas = doPeriodo.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + t.valorCentavos, 0)
    return { competencia: mes, receitasCentavos: receitas, despesasCentavos: despesas, sobraCentavos: receitas - despesas }
  })

  // Meses sem nenhum lançamento são lar recém-criado, não mês de gasto zero:
  // incluí-los na média puxaria a despesa média artificialmente para baixo.
  const mesesComDados = historico.filter((mes) => mes.receitasCentavos > 0 || mes.despesasCentavos > 0)
  const divisor = Math.max(1, mesesComDados.length)

  // Renda declarada pelos membros na conversa inicial. Vale como referência
  // enquanto não há salário lançado: sem ela, todo cálculo que divide pela renda
  // (comprometimento, plano de pagamento) trataria quem acabou de chegar como
  // se não ganhasse nada, e diria que nenhuma dívida fecha.
  const rendaDeclaradaCentavos = lar.membros.reduce((soma, membro) => soma + membro.rendaMensalCentavos, 0)

  const receitaObservada = Math.round(mesesComDados.reduce((s, m) => s + m.receitasCentavos, 0) / divisor)
  const despesaObservada = Math.round(mesesComDados.reduce((s, m) => s + m.despesasCentavos, 0) / divisor)

  const medias = {
    receitaCentavos: receitaObservada || rendaDeclaradaCentavos,
    // Mesma lógica da receita: sem histórico, vale o que o usuário estimou na
    // conversa inicial. Custo zero faria o app anunciar uma sobra irreal.
    despesaCentavos: despesaObservada || lar.custoEstimadoCentavos,
    sobraCentavos: receitaObservada
      ? Math.round(mesesComDados.reduce((s, m) => s + m.sobraCentavos, 0) / divisor)
      : rendaDeclaradaCentavos - (despesaObservada || lar.custoEstimadoCentavos),
    custoFixoCentavos: recorrencias
      .filter((recorrencia) => recorrencia.tipo === "DESPESA" && recorrencia.periodicidade === "MENSAL")
      .reduce((soma, recorrencia) => soma + recorrencia.valorCentavos, 0),
    custoEssencialCentavos: Math.round(
      transacoesHistorico
        .filter((t) => t.tipo === "DESPESA" && t.categoria?.essencial)
        .reduce((s, t) => s + t.valorCentavos, 0) / divisor,
    ),
    rendaDeclaradaCentavos,
  }

  // ── Orçamento ─────────────────────────────────────────────
  const linhasOrcamento = orcamentos.map((orcamento) => {
    const gasto = porCategoria.get(orcamento.categoriaId)?.totalCentavos ?? 0
    return {
      categoriaId: orcamento.categoriaId,
      nome: orcamento.categoria.nome,
      limiteCentavos: orcamento.limiteCentavos,
      gastoCentavos: gasto,
      percentual: orcamento.limiteCentavos > 0 ? Math.round((gasto / orcamento.limiteCentavos) * 100) : 0,
      estourou: gasto > orcamento.limiteCentavos,
    }
  })

  // ── Metas ─────────────────────────────────────────────────
  const metasProjetadas = metas.map((meta) => {
    const projecao = projetarMeta({
      alvoCentavos: meta.alvoCentavos,
      saldoAtualCentavos: meta.saldoCentavos,
      aporteMensalCentavos: meta.aporteMensalCentavos,
      rendimentoAnualBps: meta.rendimentoAnualBps,
      dataAlvo: meta.dataAlvo,
    })
    return {
      id: meta.id,
      nome: meta.nome,
      tipo: meta.tipo as string,
      alvoCentavos: meta.alvoCentavos,
      saldoCentavos: meta.saldoCentavos,
      percentual: projecao.percentual,
      mesesRestantes: projecao.mesesRestantes,
      aporteNecessarioCentavos: projecao.aporteNecessarioCentavos,
      aporteAtualCentavos: meta.aporteMensalCentavos,
      noPrazo: projecao.noPrazo,
      dataAlvo: meta.dataAlvo,
    }
  })

  // ── Dívidas ───────────────────────────────────────────────
  const listaDividas = dividas.map((divida) => ({
    id: divida.id,
    credor: divida.credor,
    saldoDevedorCentavos: divida.saldoDevedorCentavos,
    jurosMensalBps: divida.jurosMensalBps,
    parcelaCentavos: divida.parcelaCentavos,
    tipo: divida.tipo as string,
    parcelasTotal: divida.parcelasTotal,
    parcelasPagas: divida.parcelasPagas,
    diaVencimento: divida.diaVencimento,
  }))

  const parcelaMensal = listaDividas.reduce((soma, divida) => soma + divida.parcelaCentavos, 0)
  const rendaReferencia = medias.receitaCentavos || receitasMes || 1
  const sobraParaDividas = Math.max(0, medias.sobraCentavos)

  // ── Reserva ───────────────────────────────────────────────
  const custoParaReserva = medias.custoEssencialCentavos || medias.custoFixoCentavos || medias.despesaCentavos
  const metaReserva = metas.find((meta) => meta.tipo === "RESERVA_EMERGENCIA")
  const reservaAtual = metaReserva?.saldoCentavos ?? Math.max(0, saldoTotalCentavos)
  const idealReserva = reservaIdeal(custoParaReserva, lar.mesesReserva)

  // ── Projeção de caixa ─────────────────────────────────────
  const eventosFuturos = recorrencias
    .filter((recorrencia) => recorrencia.periodicidade !== "MENSAL")
    .map((recorrencia) => ({
      competencia: `${recorrencia.proximaData.getUTCFullYear()}-${String(recorrencia.proximaData.getUTCMonth() + 1).padStart(2, "0")}`,
      valorCentavos: recorrencia.valorCentavos,
      tipo: recorrencia.tipo === "RECEITA" ? ("RECEITA" as const) : ("DESPESA" as const),
    }))

  const receitasFixas = recorrencias
    .filter((r) => r.tipo === "RECEITA" && r.periodicidade === "MENSAL")
    .reduce((soma, r) => soma + r.valorCentavos, 0)

  const projecao = projetarFluxo({
    competenciaInicial: competenciaMaisMeses(competencia, 1),
    meses: 12,
    saldoInicialCentavos: saldoTotalCentavos,
    receitasFixasCentavos: receitasFixas || medias.receitaCentavos,
    despesasFixasCentavos: medias.custoFixoCentavos + parcelaMensal,
    despesasVariaveisMediaCentavos: Math.max(0, medias.despesaCentavos - medias.custoFixoCentavos),
    eventos: eventosFuturos,
    proximaCompetencia: competenciaMaisMeses,
  })

  // ── Aposentadoria ─────────────────────────────────────────
  const metaAposentadoria = metas.find((meta) => meta.tipo === "APOSENTADORIA")
  const aposentadoria = metaAposentadoria
    ? projetarAposentadoria({
        idadeAtual: 35,
        idadeAposentadoria: metaAposentadoria.dataAlvo
          ? 35 + Math.max(1, Math.round(distanciaEmMeses(competencia, `${metaAposentadoria.dataAlvo.getUTCFullYear()}-01`) / 12))
          : 60,
        patrimonioAtualCentavos: metaAposentadoria.saldoCentavos,
        aporteMensalCentavos: metaAposentadoria.aporteMensalCentavos,
        // Sem rendimento informado, 5% reais ao ano é a referência conservadora
        // usada para carteira diversificada de longo prazo no Brasil.
        rendimentoRealAnualBps: metaAposentadoria.rendimentoAnualBps || 500,
        gastoMensalDesejadoCentavos: medias.despesaCentavos || 500_000,
      })
    : null

  // ── MEI ───────────────────────────────────────────────────
  let mei: Panorama["mei"] = null
  if (lar.meiPerfil) {
    const ano = Number(competencia.slice(0, 4))
    const mesAtual = Number(competencia.slice(5, 7))
    const faturamentoPorCompetencia = meiCompetencias.map((linha) => ({
      competencia: linha.competencia,
      valorCentavos: linha.receitaComercioCentavos + linha.receitaServicosCentavos,
    }))

    const situacao = avaliarMei({
      faturamentoPorCompetencia,
      limiteAnualCentavos: lar.meiPerfil.limiteAnualCentavos,
      mesAtual,
      ano,
    })

    const dasEmAberto = meiCompetencias
      .filter((linha) => !linha.dasPago && linha.competencia < competencia)
      .map((linha) => linha.competencia)
      .sort()

    const proximoDasEm = new Date(
      Date.UTC(ano, mesAtual - 1, Math.min(lar.meiPerfil.diaVencimentoDas, 28)),
    )

    mei = { ...situacao, dasEmAberto, proximoDasEm }
  }

  return {
    lar: {
      id: lar.id,
      nome: lar.nome,
      tipo: lar.tipo as string,
      diaInicioMes: lar.diaInicioMes,
      estrategiaDivida: lar.estrategiaDivida as Panorama["lar"]["estrategiaDivida"],
      mesesReserva: lar.mesesReserva,
    },
    competencia,
    saldoTotalCentavos,
    saldoPorConta,
    mes: {
      receitasCentavos: receitasMes,
      despesasCentavos: despesasMes,
      sobraCentavos: receitasMes - despesasMes,
      taxaPoupancaBps: bps(receitasMes - despesasMes, receitasMes),
      despesasPorCategoria: [...porCategoria.values()].sort((a, b) => b.totalCentavos - a.totalCentavos),
      despesasPorMembro: [...porMembro.values()].sort((a, b) => b.totalCentavos - a.totalCentavos),
      aPagarCentavos: transacoesMes.filter((t) => !t.pago && t.tipo === "DESPESA").reduce((s, t) => s + t.valorCentavos, 0),
      naoCategorizadas: doMes.filter((t) => !t.categoriaId).length,
    },
    historico,
    medias,
    orcamento: {
      competencia,
      linhas: linhasOrcamento,
      limiteTotalCentavos: linhasOrcamento.reduce((s, l) => s + l.limiteCentavos, 0),
      gastoTotalCentavos: linhasOrcamento.reduce((s, l) => s + l.gastoCentavos, 0),
    },
    metas: metasProjetadas,
    dividas: {
      lista: listaDividas,
      totalCentavos: listaDividas.reduce((s, d) => s + d.saldoDevedorCentavos, 0),
      parcelaMensalCentavos: parcelaMensal,
      comprometimentoBps: bps(parcelaMensal, rendaReferencia),
      plano: listaDividas.length > 0 ? compararEstrategias(listaDividas, sobraParaDividas) : null,
    },
    reserva: {
      idealCentavos: idealReserva,
      atualCentavos: reservaAtual,
      percentual: idealReserva > 0 ? Math.min(100, Math.round((reservaAtual / idealReserva) * 100)) : 0,
      mesesDeFolga: mesesDeFolga(reservaAtual, custoParaReserva),
    },
    projecao,
    aposentadoria,
    mei,
    recorrenciasProximas: recorrencias.slice(0, 10).map((recorrencia) => ({
      id: recorrencia.id,
      descricao: recorrencia.descricao,
      valorCentavos: recorrencia.valorCentavos,
      tipo: recorrencia.tipo as string,
      proximaData: recorrencia.proximaData,
    })),
  }
}
