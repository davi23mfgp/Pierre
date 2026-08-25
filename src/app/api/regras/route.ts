import { prisma } from "@/lib/prisma"
import { comSessao, corpo, exigir, ok } from "@/lib/api"
import { categorizar, type RegraAplicavel } from "@/lib/categorizar"

export const GET = comSessao(async (sessao) =>
  ok(
    await prisma.regraCategorizacao.findMany({
      where: { larId: sessao.larId },
      include: { categoria: { select: { nome: true, cor: true, icone: true } } },
      orderBy: [{ prioridade: "desc" }, { acertos: "desc" }],
    }),
  ),
)

export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    padrao: string
    categoriaId: string
    regex?: boolean
    renomearPara?: string
    membroId?: string
    tags?: string[]
    prioridade?: number
  }>(requisicao)

  const regra = await prisma.regraCategorizacao.create({
    data: {
      larId: sessao.larId,
      padrao: exigir(dados.padrao, "Informe o texto que a regra procura").trim(),
      categoriaId: exigir(dados.categoriaId, "Escolha a categoria"),
      regex: dados.regex ?? false,
      renomearPara: dados.renomearPara?.trim() || null,
      membroId: dados.membroId ?? null,
      tags: dados.tags ?? [],
      prioridade: dados.prioridade ?? 100,
    },
  })

  return ok(regra, 201)
})

export const PATCH = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{ id: string; ativa?: boolean; padrao?: string; categoriaId?: string; renomearPara?: string }>(
    requisicao,
  )

  const regra = await prisma.regraCategorizacao.findFirst({ where: { id: dados.id, larId: sessao.larId } })
  if (!regra) return ok({ erro: "Regra não encontrada." }, 404)

  return ok(
    await prisma.regraCategorizacao.update({
      where: { id: dados.id },
      data: {
        ...(dados.ativa !== undefined ? { ativa: dados.ativa } : {}),
        ...(dados.padrao !== undefined ? { padrao: dados.padrao.trim() } : {}),
        ...(dados.categoriaId !== undefined ? { categoriaId: dados.categoriaId } : {}),
        ...(dados.renomearPara !== undefined ? { renomearPara: dados.renomearPara || null } : {}),
      },
    }),
  )
})

export const DELETE = comSessao(async (sessao, requisicao) => {
  const id = new URL(requisicao.url).searchParams.get("id")
  if (!id) return ok({ erro: "Informe a regra." }, 400)
  await prisma.regraCategorizacao.deleteMany({ where: { id, larId: sessao.larId } })
  return ok({ removida: true })
})

/**
 * Reprocessa as regras sobre lançamentos já existentes.
 *
 * Por padrão só toca no que está sem categoria: recategorizar em massa o que o
 * usuário já classificou à mão apagaria o trabalho dele sem aviso.
 */
export const PUT = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{ incluirJaCategorizados?: boolean; competencia?: string }>(requisicao)

  const [regras, categorias, transacoes] = await Promise.all([
    prisma.regraCategorizacao.findMany({ where: { larId: sessao.larId, ativa: true } }),
    prisma.categoria.findMany({ where: { larId: sessao.larId }, select: { id: true, nome: true } }),
    prisma.transacao.findMany({
      where: {
        larId: sessao.larId,
        tipo: { not: "TRANSFERENCIA" },
        ...(dados.incluirJaCategorizados ? {} : { categoriaId: null }),
        ...(dados.competencia ? { competencia: dados.competencia } : {}),
      },
      select: { id: true, descricao: true, descricaoOriginal: true, categoriaId: true },
    }),
  ])

  const mapa = new Map(categorias.map((categoria) => [categoria.nome, categoria.id]))
  const acertosPorRegra = new Map<string, number>()
  let atualizadas = 0

  for (const transacao of transacoes) {
    const sugestao = categorizar(
      transacao.descricaoOriginal ?? transacao.descricao,
      regras as unknown as RegraAplicavel[],
      mapa,
    )
    if (!sugestao.categoriaId || sugestao.categoriaId === transacao.categoriaId) continue

    await prisma.transacao.update({
      where: { id: transacao.id },
      data: {
        categoriaId: sugestao.categoriaId,
        ...(sugestao.regraId && sugestao.descricaoLimpa ? { descricao: sugestao.descricaoLimpa } : {}),
      },
    })
    atualizadas += 1
    if (sugestao.regraId) acertosPorRegra.set(sugestao.regraId, (acertosPorRegra.get(sugestao.regraId) ?? 0) + 1)
  }

  await Promise.all(
    [...acertosPorRegra.entries()].map(([id, quantidade]) =>
      prisma.regraCategorizacao.update({ where: { id }, data: { acertos: { increment: quantidade } } }),
    ),
  )

  return ok({ analisadas: transacoes.length, atualizadas })
})
