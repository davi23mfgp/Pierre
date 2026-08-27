import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok } from "@/lib/api"
import { atualizarAlertas } from "@/lib/bean-counter/alertas"

export const dynamic = "force-dynamic"

export const GET = comSessao(async (sessao) => ok(await atualizarAlertas(sessao.larId)))

/** Marca alertas como lidos. Sem id, marca todos. */
export const PATCH = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{ ids?: string[] }>(requisicao)

  await prisma.alerta.updateMany({
    where: { larId: sessao.larId, ...(dados.ids?.length ? { id: { in: dados.ids } } : {}) },
    data: { lido: true },
  })

  return ok({ lidos: true })
})
