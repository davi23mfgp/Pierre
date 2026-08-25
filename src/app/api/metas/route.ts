import { prisma } from "@/lib/prisma"
import { comSessao, corpo, exigir, ok } from "@/lib/api"
import { projetarMeta } from "@/lib/financeiro"

export const GET = comSessao(async (sessao) => {
  const metas = await prisma.meta.findMany({
    where: { larId: sessao.larId },
    orderBy: [{ status: "asc" }, { prioridade: "desc" }],
    include: { conta: { select: { nome: true } } },
  })

  return ok(
    metas.map((meta) => ({
      ...meta,
      projecao: projetarMeta({
        alvoCentavos: meta.alvoCentavos,
        saldoAtualCentavos: meta.saldoCentavos,
        aporteMensalCentavos: meta.aporteMensalCentavos,
        rendimentoAnualBps: meta.rendimentoAnualBps,
        dataAlvo: meta.dataAlvo,
      }),
    })),
  )
})

export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    nome: string
    tipo?: string
    alvoCentavos: number
    saldoCentavos?: number
    dataAlvo?: string
    aporteMensalCentavos?: number
    rendimentoAnualBps?: number
    contaId?: string
    prioridade?: number
    cor?: string
    icone?: string
    observacao?: string
  }>(requisicao)

  const meta = await prisma.meta.create({
    data: {
      larId: sessao.larId,
      nome: exigir(dados.nome, "Dê um nome à meta").trim(),
      tipo: (dados.tipo ?? "OUTRO") as never,
      alvoCentavos: Math.abs(Number(exigir(dados.alvoCentavos, "Informe quanto você quer juntar"))),
      saldoCentavos: dados.saldoCentavos ?? 0,
      dataAlvo: dados.dataAlvo ? new Date(dados.dataAlvo) : null,
      aporteMensalCentavos: dados.aporteMensalCentavos ?? 0,
      rendimentoAnualBps: dados.rendimentoAnualBps ?? 0,
      contaId: dados.contaId ?? null,
      prioridade: dados.prioridade ?? 0,
      cor: dados.cor ?? "blue",
      icone: dados.icone ?? "target",
      observacao: dados.observacao ?? null,
    },
  })

  return ok(meta, 201)
})
