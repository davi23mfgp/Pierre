import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso } from "@/lib/api"
import { competenciaAtual } from "@/lib/datas"
import { avaliarMei, limiteProporcionalMei } from "@/lib/financeiro"

export const GET = comSessao(async (sessao) => {
  const perfil = await prisma.meiPerfil.findUnique({ where: { larId: sessao.larId } })
  if (!perfil) return ok({ ativo: false })

  const competencias = await prisma.meiCompetencia.findMany({
    where: { larId: sessao.larId },
    orderBy: { competencia: "asc" },
  })

  const agora = competenciaAtual()
  const ano = Number(agora.slice(0, 4))
  const mesAtual = Number(agora.slice(5, 7))

  // No ano de abertura o limite é proporcional aos meses de atividade: usar o
  // limite cheio faria o app dizer que há folga onde já houve estouro.
  const abriuNesteAno = perfil.dataAbertura && perfil.dataAbertura.getUTCFullYear() === ano
  const limiteAnualCentavos = abriuNesteAno
    ? limiteProporcionalMei(perfil.limiteAnualCentavos, (perfil.dataAbertura as Date).getUTCMonth() + 1)
    : perfil.limiteAnualCentavos

  const situacao = avaliarMei({
    faturamentoPorCompetencia: competencias.map((linha) => ({
      competencia: linha.competencia,
      valorCentavos: linha.receitaComercioCentavos + linha.receitaServicosCentavos,
    })),
    limiteAnualCentavos,
    mesAtual,
    ano,
  })

  return ok({
    ativo: true,
    perfil: { ...perfil, limiteAnualEfetivoCentavos: limiteAnualCentavos, limiteProporcional: Boolean(abriuNesteAno) },
    competencias,
    situacao,
    dasEmAberto: competencias.filter((linha) => !linha.dasPago && linha.competencia < agora).map((l) => l.competencia),
  })
})

/** Liga o modo MEI ou atualiza o perfil. */
export const PUT = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    cnpj?: string
    razaoSocial?: string
    atividade?: string
    dataAbertura?: string
    limiteAnualCentavos?: number
    dasMensalCentavos?: number
    diaVencimentoDas?: number
    proLaboreCentavos?: number
  }>(requisicao)

  const comum = {
    ...(dados.cnpj !== undefined ? { cnpj: dados.cnpj.replace(/\D/g, "") || null } : {}),
    ...(dados.razaoSocial !== undefined ? { razaoSocial: dados.razaoSocial } : {}),
    ...(dados.atividade !== undefined ? { atividade: dados.atividade as never } : {}),
    ...(dados.dataAbertura !== undefined ? { dataAbertura: dados.dataAbertura ? new Date(dados.dataAbertura) : null } : {}),
    ...(dados.limiteAnualCentavos !== undefined ? { limiteAnualCentavos: dados.limiteAnualCentavos } : {}),
    ...(dados.dasMensalCentavos !== undefined ? { dasMensalCentavos: dados.dasMensalCentavos } : {}),
    ...(dados.diaVencimentoDas !== undefined ? { diaVencimentoDas: dados.diaVencimentoDas } : {}),
    ...(dados.proLaboreCentavos !== undefined ? { proLaboreCentavos: dados.proLaboreCentavos } : {}),
  }

  const perfil = await prisma.meiPerfil.upsert({
    where: { larId: sessao.larId },
    update: comum,
    create: { larId: sessao.larId, ...comum },
  })

  return ok(perfil)
})

/** Lança o faturamento e a baixa do DAS de uma competência. */
export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    competencia: string
    receitaComercioCentavos?: number
    receitaServicosCentavos?: number
    dasPago?: boolean
    dasValorCentavos?: number
    observacao?: string
  }>(requisicao)

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(dados.competencia ?? "")) {
    throw new ErroDeUso("Competência inválida. Use o formato AAAA-MM.")
  }

  const conteudo = {
    receitaComercioCentavos: dados.receitaComercioCentavos ?? 0,
    receitaServicosCentavos: dados.receitaServicosCentavos ?? 0,
    dasPago: dados.dasPago ?? false,
    dasPagoEm: dados.dasPago ? new Date() : null,
    dasValorCentavos: dados.dasValorCentavos ?? 0,
    observacao: dados.observacao ?? null,
  }

  const competencia = await prisma.meiCompetencia.upsert({
    where: { larId_competencia: { larId: sessao.larId, competencia: dados.competencia } },
    update: conteudo,
    create: { larId: sessao.larId, competencia: dados.competencia, ...conteudo },
  })

  return ok(competencia)
})

export const DELETE = comSessao(async (sessao) => {
  // Desligar o modo MEI apaga o perfil, mas nunca o histórico de faturamento:
  // ele é a prova do que foi declarado, e pode ser preciso anos depois.
  await prisma.meiPerfil.deleteMany({ where: { larId: sessao.larId } })
  return ok({ desativado: true })
})
